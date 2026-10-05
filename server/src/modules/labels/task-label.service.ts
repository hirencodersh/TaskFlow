import { prisma } from '../../lib/prisma.js';
import { createActivityLog } from '../activity-logs/activity-log.service.js';
import { getSocketInstance } from '../../lib/socket-instance.js';
import { emitProjectEvent } from '../../lib/socket-events.js';

type UserRole =
  | 'ADMIN'
  | 'PROJECT_MANAGER'
  | 'DEVELOPER';

async function getTaskAccess(
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
          members: {
            select: {
              userId: true,
            },
          },
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

  if (!isOwner && !isMember) {
    throw new Error(
      'You do not have access to this task',
    );
  }

  return task;
}

export async function addLabelToTask(
  userId: string,
  userRole: UserRole,
  taskId: string,
  labelId: string,
) {
  const task = await getTaskAccess(
    userId,
    userRole,
    taskId,
  );

  const label = await prisma.label.findUnique({
    where: {
      id: labelId,
    },
  });

  if (!label) {
    throw new Error('Label not found');
  }

  if (label.projectId !== task.projectId) {
    throw new Error(
      'Label does not belong to this task project',
    );
  }

  const existingTaskLabel =
    await prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });

  if (existingTaskLabel) {
    throw new Error(
      'Label is already assigned to this task',
    );
  }

  const taskLabel =
    await prisma.taskLabel.create({
      data: {
        taskId,
        labelId,
      },
      include: {
        label: true,
      },
    });

  await createActivityLog({
    projectId: task.projectId,
    taskId,
    actorId: userId,
    action: 'TASK_LABEL_ADDED',
    metadata: {
      labelId,
      labelName: label.name,
    },
  });

  const io = getSocketInstance();

  emitProjectEvent(
    io,
    task.projectId,
    'task:label-added',
    taskLabel,
  );

  return taskLabel;
}

export async function getTaskLabels(
  userId: string,
  userRole: UserRole,
  taskId: string,
) {
  await getTaskAccess(
    userId,
    userRole,
    taskId,
  );

  return prisma.taskLabel.findMany({
    where: {
      taskId,
    },
    include: {
      label: true,
    },
    orderBy: {
      label: {
        name: 'asc',
      },
    },
  });
}

export async function removeLabelFromTask(
  userId: string,
  userRole: UserRole,
  taskId: string,
  labelId: string,
) {
  const task = await getTaskAccess(
    userId,
    userRole,
    taskId,
  );

  const taskLabel =
    await prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
      include: {
        label: true,
      },
    });

  if (!taskLabel) {
    throw new Error(
      'Label is not assigned to this task',
    );
  }

  await createActivityLog({
    projectId: task.projectId,
    taskId,
    actorId: userId,
    action: 'TASK_LABEL_REMOVED',
    metadata: {
      labelId,
      labelName: taskLabel.label.name,
    },
  });

  const io = getSocketInstance();

  emitProjectEvent(
    io,
    task.projectId,
    'task:label-removed',
    {
      taskId,
      labelId,
      labelName: taskLabel.label.name,
    },
  );

  await prisma.taskLabel.delete({
    where: {
      taskId_labelId: {
        taskId,
        labelId,
      },
    },
  });
}