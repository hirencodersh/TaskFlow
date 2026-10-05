import { prisma } from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';


type UserRole =
  | 'ADMIN'
  | 'PROJECT_MANAGER'
  | 'DEVELOPER';

type CreateActivityLogInput = {
  projectId: string;
  taskId?: string;
  actorId: string;
  action: string;
  metadata?: Prisma.InputJsonValue;
};

async function getProjectAccess(
  userId: string,
  userRole: UserRole,
  projectId: string,
) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      members: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (userRole === 'ADMIN') {
    return project;
  }

  const isOwner = project.ownerId === userId;

  const isMember = project.members.some(
    (member) => member.userId === userId,
  );

  if (!isOwner && !isMember) {
    throw new Error(
      'You do not have access to this project',
    );
  }

  return project;
}

export async function createActivityLog(
  input: CreateActivityLogInput,
) {
  return prisma.activityLog.create({
    data: {
      projectId: input.projectId,
      taskId: input.taskId,
      actorId: input.actorId,
      action: input.action,
      metadata: input.metadata ?? {},
    },
  });
}

export async function getActivityLogs(
  userId: string,
  userRole: UserRole,
  projectId: string,
  page: number,
  limit: number,
) {
  await getProjectAccess(
    userId,
    userRole,
    projectId,
  );

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),

    prisma.activityLog.count({
      where: {
        projectId,
      },
    }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}