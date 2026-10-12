import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { createActivityLog } from '../activity-logs/activity-log.service.js';
import { getSocketInstance } from '../../lib/socket-instance.js';
import { emitProjectEvent } from '../../lib/socket-events.js';

import type {
  CreateTaskInput,
  ListTaskQuery,
  UpdateTaskInput,
} from './task.schema.js';

type UserRole =
  | 'ADMIN'
  | 'PROJECT_MANAGER'
  | 'DEVELOPER'
  | 'DESIGNER'
  | 'QA';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

async function checkCircularDependency(taskId: string, dependencyIds: string[]) {
  if (dependencyIds.includes(taskId)) {
    return true;
  }
  for (const depId of dependencyIds) {
    const visited = new Set<string>();
    const queue = [depId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === taskId) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const subDeps = await prisma.taskDependency.findMany({
        where: { taskId: current },
        select: { dependsOnTaskId: true },
      });
      for (const sd of subDeps) {
        queue.push(sd.dependsOnTaskId);
      }
    }
  }
  return false;
}

async function validateTaskDependencies(taskId: string, targetStatus: TaskStatus) {
  if (targetStatus === 'TODO') return;

  const deps = await prisma.taskDependency.findMany({
    where: { taskId },
    include: {
      dependsOn: {
        select: { id: true, title: true, status: true },
      },
    },
  });

  const incompleteDeps = deps.filter((d) => d.dependsOn.status !== 'DONE');
  if (incompleteDeps.length > 0) {
    throw new Error(
      `Cannot update task status: blocked by incomplete dependency task(s): ${incompleteDeps.map((d) => d.dependsOn.title).join(', ')}`,
    );
  }
}

export async function createTask(
  userId: string,
  userRole: UserRole,
  input: CreateTaskInput,
) {
  if (['DEVELOPER', 'DESIGNER', 'QA'].includes(userRole)) {
    throw new Error(
      'Developers, designers, and QA cannot create tasks',
    );
  }

  const project = await prisma.project.findUnique({
    where: {
      id: input.projectId,
    },
    include: {
      members: true,
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (
    userRole !== 'ADMIN' &&
    project.ownerId !== userId
  ) {
    throw new Error(
      'Only the project owner or admin can create tasks',
    );
  }

  const assigneeIds = input.assigneeIds ?? (input.assigneeId ? [input.assigneeId] : []);

  if (assigneeIds.length > 0) {
    for (const assigneeId of assigneeIds) {
      const assigneeMember = project.members.find(
        (member) => member.userId === assigneeId,
      );

      if (!assigneeMember) {
        throw new Error(
          'All assignees must be project members',
        );
      }

      const assigneeUser = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { role: true, isActive: true },
      });

      if (!assigneeUser || !assigneeUser.isActive || !['DEVELOPER', 'DESIGNER', 'QA'].includes(assigneeUser.role)) {
        throw new Error(
          'Assignee must be an active developer, designer, or QA',
        );
      }
    }
  }

  const task = await prisma.task.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      assigneeId: assigneeIds[0] ?? null,
      dueDate: input.dueDate,
      createdById: userId,
      assignees: {
        create: assigneeIds.map((assigneeId) => ({
          userId: assigneeId,
        })),
      },
    },
    include: {
      assignees: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  });

  if (input.dependencyIds && input.dependencyIds.length > 0) {
    const isCircular = await checkCircularDependency(task.id, input.dependencyIds);
    if (isCircular) {
      throw new Error('Circular dependency detected');
    }

    await prisma.taskDependency.createMany({
      data: input.dependencyIds.map((depId) => ({
        taskId: task.id,
        dependsOnTaskId: depId,
      })),
      skipDuplicates: true,
    });
  }

  await createActivityLog({
    projectId: task.projectId,
    taskId: task.id,
    actorId: userId,
    action: 'TASK_CREATED',
    metadata: {
      taskTitle: task.title,
    },
  });

  const io = getSocketInstance();
  emitProjectEvent(io, task.projectId, 'task:created', task);

  return task;
}

export async function getTaskById(
  userId: string,
  userRole: UserRole,
  taskId: string,
) {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true,
          ownerId: true,
          members: {
            select: {
              userId: true,
            },
          },
        },
      },
      labels: {
        include: {
          label: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignees: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      dependencies: {
        include: {
          dependsOn: {
            select: { id: true, title: true, status: true, priority: true },
          },
        },
      },
      blockers: {
        include: {
          task: {
            select: { id: true, title: true, status: true, priority: true },
          },
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  if (userRole === 'ADMIN') {
    return task;
  }

  const isOwner = task.project.ownerId === userId;
  const isMember = task.project.members.some(
    (member) => member.userId === userId,
  );
  const isAssignee =
    task.assignee?.id === userId ||
    task.assignees.some((a) => a.userId === userId);

  if (!isOwner && !isMember && !isAssignee) {
    throw new Error(
      'You do not have access to this task',
    );
  }

  return task;
}

export async function updateTask(
  userId: string,
  userRole: UserRole,
  taskId: string,
  input: UpdateTaskInput,
) {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    include: {
      project: {
        include: {
          members: true,
        },
      },
      assignees: true,
    },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  const isAdmin = userRole === 'ADMIN';
  const isProjectOwner = task.project.ownerId === userId;
  const isMember = task.project.members.some(
    (member) => member.userId === userId,
  );
  const isAssignee =
    task.assigneeId === userId ||
    task.assignees.some((a) => a.userId === userId);

  if (!isAdmin && !isProjectOwner && !isMember && !isAssignee) {
    throw new Error(
      'You do not have access to this task',
    );
  }

  if (['DEVELOPER', 'DESIGNER'].includes(userRole)) {
    if (!isAssignee) {
      throw new Error(
        'Developers and designers can only update tasks assigned to them',
      );
    }

    const allowedFields = Object.keys(input);
    const hasUnauthorizedField = allowedFields.some(
      (field) => !['status'].includes(field),
    );

    if (hasUnauthorizedField) {
      throw new Error(
        'Developers and designers can only update task status',
      );
    }

    if (input.status === 'DONE') {
      throw new Error(
        'Developers and designers cannot set task status to DONE',
      );
    }
  }

  if (input.status) {
    await validateTaskDependencies(taskId, input.status);
  }

  if (input.assigneeIds || input.assigneeId) {
    const assigneeIds = input.assigneeIds ?? (input.assigneeId ? [input.assigneeId] : []);
    for (const assigneeId of assigneeIds) {
      const isAssigneeMember = task.project.members.some(
        (member) => member.userId === assigneeId,
      );

      if (!isAssigneeMember) {
        throw new Error(
          'Assignee must be a project member',
        );
      }

      const assigneeUser = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { role: true, isActive: true },
      });

      if (!assigneeUser || !assigneeUser.isActive || !['DEVELOPER', 'DESIGNER', 'QA'].includes(assigneeUser.role)) {
        throw new Error(
          'Assignee must be an active developer, designer, or QA',
        );
      }
    }

    await prisma.taskAssignee.deleteMany({
      where: { taskId },
    });

    if (assigneeIds.length > 0) {
      await prisma.taskAssignee.createMany({
        data: assigneeIds.map((assigneeId) => ({
          taskId,
          userId: assigneeId,
        })),
        skipDuplicates: true,
      });
    }

    input.assigneeId = assigneeIds[0] ?? undefined;
  }

  if (input.dependencyIds) {
    const isCircular = await checkCircularDependency(taskId, input.dependencyIds);
    if (isCircular) {
      throw new Error('Circular dependency detected');
    }

    await prisma.taskDependency.deleteMany({
      where: { taskId },
    });

    if (input.dependencyIds.length > 0) {
      await prisma.taskDependency.createMany({
        data: input.dependencyIds.map((depId) => ({
          taskId,
          dependsOnTaskId: depId,
        })),
        skipDuplicates: true,
      });
    }
  }

  const { assigneeIds: _, dependencyIds: __, ...restInput } = input;

  const updatedTask = await prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      ...restInput,
    },
    include: {
      assignees: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      dependencies: {
        include: {
          dependsOn: {
            select: { id: true, title: true, status: true },
          },
        },
      },
    },
  });

  await createActivityLog({
    projectId: updatedTask.projectId,
    taskId: updatedTask.id,
    actorId: userId,
    action: 'TASK_UPDATED',
    metadata: {
      changes: input,
    },
  });

  const io = getSocketInstance();
  emitProjectEvent(io, updatedTask.projectId, 'task:updated', updatedTask);

  return updatedTask;
}

export async function deleteTask(
  userId: string,
  userRole: UserRole,
  taskId: string,
) {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    include: {
      project: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  const isAdmin = userRole === 'ADMIN';
  const isProjectOwner = task.project.ownerId === userId;

  if (!isAdmin && !isProjectOwner) {
    throw new Error(
      'Only the project owner or admin can delete tasks',
    );
  }

  await createActivityLog({
    projectId: task.projectId,
    taskId: task.id,
    actorId: userId,
    action: 'TASK_DELETED',
    metadata: {
      taskTitle: task.title,
    },
  });

  const io = getSocketInstance();
  emitProjectEvent(io, task.projectId, 'task:deleted', {
    taskId: task.id,
    projectId: task.projectId,
  });

  await prisma.task.delete({
    where: {
      id: taskId,
    },
  });
}

export async function getTasks(
  userId: string,
  userRole: UserRole,
  query: ListTaskQuery,
) {
  const {
    search,
    status,
    priority,
    assigneeId,
    page,
    limit,
    sortBy,
    sortOrder,
  } = query;

  const where: Prisma.TaskWhereInput =
    userRole === 'ADMIN'
      ? {}
      : userRole === 'PROJECT_MANAGER'
        ? {
            project: {
              ownerId: userId,
            },
          }
        : {
            OR: [
              {
                project: {
                  members: {
                    some: {
                      userId,
                    },
                  },
                },
              },
              {
                assigneeId: userId,
              },
              {
                assignees: {
                  some: {
                    userId,
                  },
                },
              },
            ],
          };

  if (search) {
    where.title = {
      contains: search,
      mode: 'insensitive',
    };
  }

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (assigneeId) {
    where.OR = [
      { assigneeId },
      { assignees: { some: { userId: assigneeId } } },
    ];
  }

  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        dependencies: {
          include: {
            dependsOn: {
              select: { id: true, title: true, status: true },
            },
          },
        },
        blockers: {
          include: {
            task: {
              select: { id: true, title: true, status: true },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),

    prisma.task.count({
      where,
    }),
  ]);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
