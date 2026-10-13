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

async function validateTaskDueDate(project: { startDate: Date | null; dueDate: Date | null }, dueDate: Date | undefined) {
  if (!dueDate) return;

  if (project.startDate && new Date(dueDate).getTime() < new Date(project.startDate).getTime()) {
    throw new Error('Task due date cannot be earlier than the project start date');
  }

  if (project.dueDate && new Date(dueDate).getTime() > new Date(project.dueDate).getTime()) {
    throw new Error('Task due date cannot be later than the project due date');
  }
}

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

  await validateTaskDueDate(project, input.dueDate);

  // Handle Pipeline creation (Design -> Development -> QA)
  if (input.isPipeline) {
    const designAssigneeId = input.designAssigneeId;
    const devAssigneeId = input.devAssigneeId;
    const qaAssigneeId = input.qaAssigneeId;

    const pipelineAssignees = [
      { id: designAssigneeId, expectedRole: 'DESIGNER', name: 'Design' },
      { id: devAssigneeId, expectedRole: 'DEVELOPER', name: 'Development' },
      { id: qaAssigneeId, expectedRole: 'QA', name: 'QA' },
    ];

    for (const pa of pipelineAssignees) {
      if (pa.id) {
        const member = project.members.find((m) => m.userId === pa.id);
        if (!member) {
          throw new Error(`${pa.name} assignee must be a project member`);
        }
        const userObj = await prisma.user.findUnique({
          where: { id: pa.id },
          select: { role: true, isActive: true },
        });
        if (!userObj || !userObj.isActive || userObj.role !== pa.expectedRole) {
          throw new Error(`${pa.name} assignee must be an active ${pa.expectedRole}`);
        }
      }
    }

    return prisma.$transaction(async (tx) => {
      const designTask = await tx.task.create({
        data: {
          projectId: input.projectId,
          title: `[Design] ${input.title}`,
          description: input.description,
          status: 'TODO',
          priority: input.priority,
          assigneeId: designAssigneeId || null,
          dueDate: input.dueDate,
          createdById: userId,
          assignees: designAssigneeId
            ? { create: { userId: designAssigneeId } }
            : undefined,
        },
      });

      const devTask = await tx.task.create({
        data: {
          projectId: input.projectId,
          title: `[Development] ${input.title}`,
          description: input.description,
          status: 'TODO',
          priority: input.priority,
          assigneeId: devAssigneeId || null,
          dueDate: input.dueDate,
          createdById: userId,
          assignees: devAssigneeId
            ? { create: { userId: devAssigneeId } }
            : undefined,
        },
      });

      const qaTask = await tx.task.create({
        data: {
          projectId: input.projectId,
          title: `[QA] ${input.title}`,
          description: input.description,
          status: 'TODO',
          priority: input.priority,
          assigneeId: qaAssigneeId || null,
          dueDate: input.dueDate,
          createdById: userId,
          assignees: qaAssigneeId
            ? { create: { userId: qaAssigneeId } }
            : undefined,
        },
      });

      // Link Dev depends on Design
      await tx.taskDependency.create({
        data: {
          taskId: devTask.id,
          dependsOnTaskId: designTask.id,
        },
      });

      // Link QA depends on Dev
      await tx.taskDependency.create({
        data: {
          taskId: qaTask.id,
          dependsOnTaskId: devTask.id,
        },
      });

      await createActivityLog({
        projectId: project.id,
        actorId: userId,
        action: 'TASK_PIPELINE_CREATED',
        metadata: {
          pipelineTitle: input.title,
          designTaskId: designTask.id,
          devTaskId: devTask.id,
          qaTaskId: qaTask.id,
        },
      });

      const io = getSocketInstance();
      emitProjectEvent(io, project.id, 'task:pipeline-created', {
        designTask,
        devTask,
        qaTask,
      });

      return {
        designTask,
        devTask,
        qaTask,
      };
    });
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

  // Handle QA Return to Developer action
  if (input.returnToDeveloper && input.returnReason && input.targetDevTaskId) {
    if (userRole !== 'ADMIN' && userRole !== 'QA') {
      throw new Error('Only QA or Admin can return tasks to developers');
    }

    const devTask = await prisma.task.findUnique({
      where: { id: input.targetDevTaskId },
      include: { assignee: true, assignees: true },
    });

    if (!devTask) {
      throw new Error('Target development task not found');
    }

    // Reopen development task
    await prisma.task.update({
      where: { id: input.targetDevTaskId },
      data: { status: 'IN_PROGRESS' },
    });

    // Create comment / log reason on dev task
    await prisma.comment.create({
      data: {
        taskId: input.targetDevTaskId,
        authorId: userId,
        content: `[QA Returned]: ${input.returnReason}`,
      },
    });

    await createActivityLog({
      projectId: task.projectId,
      taskId: task.id,
      actorId: userId,
      action: 'TASK_RETURNED_TO_DEVELOPER',
      metadata: {
        reason: input.returnReason,
        devTaskId: input.targetDevTaskId,
      },
    });

    // Notify developer if assigned
    const devAssigneeId = devTask.assigneeId || devTask.assignees[0]?.userId;
    if (devAssigneeId) {
      const { createNotification } = await import('../notifications/notification.service.js');
      await createNotification({
        userId: devAssigneeId,
        title: 'Task Returned by QA',
        message: `Task "${devTask.title}" was returned by QA. Reason: ${input.returnReason}`,
        type: 'TASK_RETURNED',
        link: `/tasks/${input.targetDevTaskId}`,
      });
    }
  }

  if (input.dueDate) {
    await validateTaskDueDate(task.project, input.dueDate);
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

  const previousStatus = task.status;

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

  // If task just transitioned to DONE, notify dependent tasks / next stage assignees
  if (previousStatus !== 'DONE' && updatedTask.status === 'DONE') {
    const dependentTaskRelations = await prisma.taskDependency.findMany({
      where: { dependsOnTaskId: taskId },
      include: {
        task: {
          include: {
            assignee: true,
            assignees: true,
          },
        },
      },
    });

    for (const depRel of dependentTaskRelations) {
      const nextTask = depRel.task;
      const nextAssigneeId = nextTask.assigneeId || nextTask.assignees[0]?.userId;
      if (nextAssigneeId) {
        const { createNotification } = await import('../notifications/notification.service.js');
        await createNotification({
          userId: nextAssigneeId,
          title: 'Prerequisite Task Completed',
          message: `Prerequisite task "${updatedTask.title}" is now DONE. Your task "${nextTask.title}" is ready / actionable.`,
          type: 'TASK_ACTIONABLE',
          link: `/tasks/${nextTask.id}`,
        });
      }
    }

    // Check if part of a pipeline using dependency traversal (Design -> Development -> QA)
    // Find root (Design) or traverse up/down dependencies in the same project
    const allProjectTasks = await prisma.task.findMany({
      where: { projectId: updatedTask.projectId },
      include: {
        dependencies: { select: { dependsOnTaskId: true } },
      },
    });

    const taskMap = new Map(allProjectTasks.map((t) => [t.id, t]));

    // Find if updatedTask is part of a 3-tier chain (Design -> Dev -> QA)
    // Let's trace back to find the root task (in-degree 0 among pipeline) or forward
    let rootTask: typeof allProjectTasks[0] | null = null;
    let current: typeof allProjectTasks[0] | undefined = updatedTask;
    const visited = new Set<string>();

    while (current && current.dependencies.length > 0 && !visited.has(current.id)) {
      visited.add(current.id);
      const parentId = current.dependencies[0]?.dependsOnTaskId;
      if (parentId && taskMap.has(parentId)) {
        current = taskMap.get(parentId);
      } else {
        break;
      }
    }
    rootTask = current || null;

    if (rootTask) {
      // Gather chain: root -> child -> grandchild
      const chain: string[] = [rootTask.id];
      let cursor = rootTask.id;
      while (true) {
        const child = allProjectTasks.find((t) => t.dependencies.some((d) => d.dependsOnTaskId === cursor));
        if (child && !chain.includes(child.id)) {
          chain.push(child.id);
          cursor = child.id;
        } else {
          break;
        }
      }

      if (chain.length === 3) {
        const pipelineTasks = chain.map((id) => taskMap.get(id)!).filter(Boolean);
        const pipelineTitle = rootTask.title.replace(/^\[(Design|Development|QA)\]\s+/, '');

        if (pipelineTasks.length === 3 && pipelineTasks.every((pt) => pt.status === 'DONE')) {
          // Check if TASK_PIPELINE_COMPLETED was already logged for this pipeline title in this project
          const existingLog = await prisma.activityLog.findFirst({
            where: {
              projectId: updatedTask.projectId,
              action: 'TASK_PIPELINE_COMPLETED',
              metadata: {
                path: ['pipelineTitle'],
                equals: pipelineTitle,
              },
            },
          });

          if (!existingLog) {
            await createActivityLog({
              projectId: updatedTask.projectId,
              actorId: userId,
              action: 'TASK_PIPELINE_COMPLETED',
              metadata: {
                pipelineTitle,
              },
            });
          }
        }
      }
    }
  }

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
    myWork,
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

  if (myWork) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { assigneeId: userId },
          { assignees: { some: { userId } } },
        ],
      },
    ];
  }

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
