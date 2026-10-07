import { prisma } from '../../lib/prisma.js';
import { getSocketInstance } from '../../lib/socket-instance.js';
import { emitProjectEvent } from '../../lib/socket-events.js';
import { createActivityLog } from '../activity-logs/activity-log.service.js';

import type {
  CreateProjectInput,
  UpdateProjectInput,
} from './project.schema.js';

type UserRole =
  | 'ADMIN'
  | 'PROJECT_MANAGER'
  | 'DEVELOPER';

export async function createProject(
  userId: string,
  userRole: UserRole,
  input: CreateProjectInput,
) {
  if (userRole === 'DEVELOPER') {
    throw new Error(
      'Developers cannot create projects',
    );
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

  await createActivityLog({
    projectId: project.id,
    actorId: userId,
    action: 'PROJECT_CREATED',
    metadata: {
      projectName: project.name,
    },
  });

  const io = getSocketInstance();

  emitProjectEvent(
    io,
    project.id,
    'project:created',
    project,
  );

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
    throw new Error(
      'You do not have access to this project',
    );
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

  if (
    userRole !== 'ADMIN' &&
    project.ownerId !== userId
  ) {
    throw new Error(
      'Only the project owner or admin can update this project',
    );
  }

  const updatedProject =
    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        ...(input.name !== undefined && {
          name: input.name,
        }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.status !== undefined && {
          status: input.status,
        }),
        ...(input.startDate !== undefined && {
          startDate: input.startDate,
        }),
        ...(input.dueDate !== undefined && {
          dueDate: input.dueDate,
        }),
      },
    });

  await createActivityLog({
    projectId: updatedProject.id,
    actorId: userId,
    action: 'PROJECT_UPDATED',
    metadata: {
      changes: input,
    },
  });

  const io = getSocketInstance();

  emitProjectEvent(
    io,
    updatedProject.id,
    'project:updated',
    updatedProject,
  );

  return updatedProject;
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

  if (
    userRole !== 'ADMIN' &&
    project.ownerId !== userId
  ) {
    throw new Error(
      'Only the project owner or admin can delete this project',
    );
  }

  await createActivityLog({
    projectId: project.id,
    actorId: userId,
    action: 'PROJECT_DELETED',
    metadata: {
      projectId: project.id,
      projectName: project.name,
    },
  });

  const io = getSocketInstance();

  emitProjectEvent(
    io,
    project.id,
    'project:deleted',
    {
      projectId: project.id,
      projectName: project.name,
    },
  );

  await prisma.project.delete({
    where: {
      id: projectId,
    },
  });
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  requesterId: string,
  requesterRole: UserRole,
) {
  if (requesterRole === 'DEVELOPER') {
    throw new Error(
      'Developers cannot manage project members',
    );
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (
    requesterRole !== 'ADMIN' &&
    project.ownerId !== requesterId
  ) {
    throw new Error(
      'Only the project owner or admin can manage project members',
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.isActive) {
    throw new Error('User account is inactive');
  }

  const existingMember =
    await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

  if (existingMember) {
    throw new Error(
      'User is already a project member',
    );
  }

  const member =
    await prisma.projectMember.create({
      data: {
        projectId,
        userId,
      },
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
    });

  await createActivityLog({
    projectId,
    actorId: requesterId,
    action: 'PROJECT_MEMBER_ADDED',
    metadata: {
      userId,
      userName: user.name,
    },
  });

  const io = getSocketInstance();

  emitProjectEvent(
    io,
    projectId,
    'project:member-added',
    member,
  );

  return member;
}

export async function getProjectMembers(
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
              isActive: true,
            },
          },
        },
        orderBy: {
          joinedAt: 'asc',
        },
      },
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (userRole === 'ADMIN') {
    return project.members;
  }

  const isMember = project.members.some(
    (member) => member.userId === userId,
  );

  if (!isMember) {
    throw new Error(
      'You do not have access to this project',
    );
  }

  return project.members;
}

export async function removeProjectMember(
  projectId: string,
  memberUserId: string,
  requesterId: string,
  requesterRole: UserRole,
) {
  if (requesterRole === 'DEVELOPER') {
    throw new Error(
      'Developers cannot manage project members',
    );
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (
    requesterRole !== 'ADMIN' &&
    project.ownerId !== requesterId
  ) {
    throw new Error(
      'Only the project owner or admin can manage project members',
    );
  }

  if (project.ownerId === memberUserId) {
    throw new Error(
      'Project owner cannot be removed',
    );
  }

  const member =
    await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: memberUserId,
        },
      },
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
    });

  if (!member) {
    throw new Error(
      'Project member not found',
    );
  }

  await createActivityLog({
    projectId,
    actorId: requesterId,
    action: 'PROJECT_MEMBER_REMOVED',
    metadata: {
      userId: member.userId,
      userName: member.user.name,
    },
  });

  const io = getSocketInstance();

  emitProjectEvent(
    io,
    projectId,
    'project:member-removed',
    {
      projectId,
      user: member.user,
    },
  );

  await prisma.projectMember.delete({
    where: {
      projectId_userId: {
        projectId,
        userId: memberUserId,
      },
    },
  });
}

export async function getAvailableProjectUsers(
  projectId: string,
  userId: string,
  userRole: UserRole,
) {
  if (userRole === 'DEVELOPER') {
    throw new Error(
      'Developers cannot access available project users',
    );
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      ownerId: true,
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
      'Only the project owner or admin can access available project users',
    );
  }

  return prisma.user.findMany({
    where: {
      isActive: true,
      projectMemberships: {
        none: {
          projectId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}