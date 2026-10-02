
import { prisma } from '../../lib/prisma.js';

import type {
  CreateProjectInput,
  UpdateProjectInput,
} from './project.schema.js';

type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export async function createProject(
  userId: string,
  userRole: UserRole,
  input: CreateProjectInput,
) {
  if (userRole === 'DEVELOPER') {
    throw new Error('Developers cannot create projects');
  }

  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      status: input.status,
      startDate: input.startDate ?? new Date(),
      dueDate: input.dueDate ?? new Date(),
      ownerId: userId,
    },
  });

  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId,
    },
  });

  return project;
}

export async function getProjects(
  userId: string,
  userRole: UserRole,
) {
  if (userRole === 'ADMIN') {
    return prisma.project.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  if (userRole === 'PROJECT_MANAGER') {
    return prisma.project.findMany({
      where: {
        ownerId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  return prisma.project.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getProjectById(
  projectId: string,
  userId: string,
  userRole: UserRole,
) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
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

  if (project.ownerId === userId) {
    return project;
  }

  const isMember = project.members.some(
    (member) => member.userId === userId,
  );

  if (!isMember) {
    throw new Error('You do not have access to this project');
  }

  return project;
}

export async function updateProject(
  projectId: string,
  userId: string,
  userRole: UserRole,
  input: UpdateProjectInput,
) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (userRole !== 'ADMIN' && project.ownerId !== userId) {
    throw new Error(
      'Only the project owner or admin can update this project',
    );
  }

  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: input,
  });
}

export async function deleteProject(
  projectId: string,
  userId: string,
  userRole: UserRole,
) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (userRole !== 'ADMIN' && project.ownerId !== userId) {
    throw new Error(
      'Only the project owner or admin can delete this project',
    );
  }

  await prisma.project.delete({
    where: {
      id: projectId,
    },
  });
}

