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
  | 'DEVELOPER';

export async function createTask(
  userId: string,
  userRole: UserRole,
  input: CreateTaskInput,
) {
  if (userRole === 'DEVELOPER') {
    throw new Error(
      'Developers cannot create tasks',
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

  if (input.assigneeId) {
    const assigneeMember = project.members.find(
      (member) =>
        member.userId === input.assigneeId,
    );

    if (!assigneeMember) {
      throw new Error(
        'Assignee must be a project member',
      );
    }

    const assigneeUser = await prisma.user.findUnique({
      where: { id: input.assigneeId },
      select: { role: true },
    });

    if (!assigneeUser || assigneeUser.role !== 'DEVELOPER') {
      throw new Error(
        'Assignee must be a developer',
      );
    }
  }

  const task = await prisma.task.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      createdById: userId,
    },
  });

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

  emitProjectEvent(
    io,
    task.projectId,
    'task:created',
    task,
  );

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

  const isOwner =
    task.project.ownerId === userId;

  const isMember =
    task.project.members.some(
      (member) => member.userId === userId,
    );

  const isAssignee =
    task.assignee?.id === userId;

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
    },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  const isAdmin = userRole === 'ADMIN';

  const isProjectOwner =
    task.project.ownerId === userId;

  const isMember =
    task.project.members.some(
      (member) => member.userId === userId,
    );

  const isAssignee =
    task.assigneeId === userId;

  if (
    !isAdmin &&
    !isProjectOwner &&
    !isMember
  ) {
    throw new Error(
      'You do not have access to this task',
    );
  }

  if (userRole === 'DEVELOPER') {
    if (!isAssignee) {
      throw new Error(
        'Developers can only update tasks assigned to them',
      );
    }

    const developerAllowedFields =
      Object.keys(input);

    const hasUnauthorizedField =
      developerAllowedFields.some(
        (field) => !['status'].includes(field),
      );

    if (hasUnauthorizedField) {
      throw new Error(
        'Developers can only update task status',
      );
    }

    if (input.status === 'DONE') {
      throw new Error(
        'Developers cannot set task status to DONE',
      );
    }
  }

  if (input.assigneeId) {
    const isAssigneeMember =
      task.project.members.some(
        (member) =>
          member.userId === input.assigneeId,
      );

    if (!isAssigneeMember) {
      throw new Error(
        'Assignee must be a project member',
      );
    }

    const assigneeUser = await prisma.user.findUnique({
      where: { id: input.assigneeId },
      select: { role: true },
    });

    if (!assigneeUser || assigneeUser.role !== 'DEVELOPER') {
      throw new Error(
        'Assignee must be a developer',
      );
    }
  }

  const updatedTask =
    await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        ...input,
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

  emitProjectEvent(
    io,
    updatedTask.projectId,
    'task:updated',
    updatedTask,
  );

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

  const isAdmin =
    userRole === 'ADMIN';

  const isProjectOwner =
    task.project.ownerId === userId;

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

  emitProjectEvent(
    io,
    task.projectId,
    'task:deleted',
    {
      taskId: task.id,
      projectId: task.projectId,
    },
  );

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
    where.assigneeId = assigneeId;
  }

  const skip = (page - 1) * limit;

  const [tasks, total] =
    await Promise.all([
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
      totalPages: Math.ceil(
        total / limit,
      ),
    },
  };
}