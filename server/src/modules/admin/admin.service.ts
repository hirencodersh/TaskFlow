import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../utils/password.js';

import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserPermissionsInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
} from './admin.schema.js';

type UserRole =
  | 'ADMIN'
  | 'PROJECT_MANAGER'
  | 'DEVELOPER'
  | 'DESIGNER'
  | 'QA';

export async function getUsers(
  query: ListUsersQuery,
) {
  const {
    search,
    role,
    isActive,
    page,
    limit,
  } = query;

  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              email: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),

    ...(role ? { role } : {}),
    ...(isActive !== undefined
      ? { isActive }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserById(
  targetUserId: string,
) {
  const user = await prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      permissions: true,
      createdAt: true,
      updatedAt: true,
      assignedTasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          projectId: true,
          project: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      projectMemberships: {
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
              ownerId: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const totalAssigned = user.assignedTasks.length;
  const completedTasks = user.assignedTasks.filter(
    (t) => t.status === 'DONE',
  ).length;
  const inProgressTasks = user.assignedTasks.filter(
    (t) =>
      t.status === 'IN_PROGRESS' ||
      t.status === 'IN_REVIEW',
  ).length;
  const todoTasks = user.assignedTasks.filter(
    (t) => t.status === 'TODO',
  ).length;

  return {
    ...user,
    stats: {
      totalAssigned,
      completedTasks,
      inProgressTasks,
      todoTasks,
    },
  };
}

export async function updateUserRole(
  targetUserId: string,
  input: UpdateUserRoleInput,
) {
  const user = await prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return prisma.user.update({
    where: {
      id: targetUserId,
    },
    data: {
      role: input.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      permissions: true,
      updatedAt: true,
    },
  });
}

export async function approveUser(
  targetUserId: string,
  role: UserRole,
) {
  const user = await prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return prisma.user.update({
    where: {
      id: targetUserId,
    },
    data: {
      isActive: true,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      permissions: true,
      updatedAt: true,
    },
  });
}

export async function updateUserPermissions(
  targetUserId: string,
  input: UpdateUserPermissionsInput,
) {
  const user = await prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return prisma.user.update({
    where: {
      id: targetUserId,
    },
    data: {
      permissions: input.permissions,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      permissions: true,
      updatedAt: true,
    },
  });
}

export async function updateUserStatus(
  targetUserId: string,
  input: UpdateUserStatusInput,
  currentUserId: string,
) {
  if (
    targetUserId === currentUserId &&
    input.isActive === false
  ) {
    throw new Error(
      'You cannot deactivate your own account',
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return prisma.user.update({
    where: {
      id: targetUserId,
    },
    data: {
      isActive: input.isActive,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      permissions: true,
      updatedAt: true,
    },
  });
}

export async function createUser(
  input: CreateUserInput,
) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email.toLowerCase(),
    },
  });

  if (existingUser) {
    throw new Error('Email is already in use');
  }

  const passwordHash = await hashPassword(
    input.password,
  );

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      permissions: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function removeUser(
  targetUserId: string,
  currentUserId: string,
) {
  if (targetUserId === currentUserId) {
    throw new Error('You cannot delete your own account');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
    include: {
      ownedProjects: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.ownedProjects.length > 0) {
    throw new Error(
      'Cannot delete user who owns active projects. Transfer ownership or delete projects first.',
    );
  }

  await prisma.$transaction([
    prisma.refreshToken.deleteMany({
      where: { userId: targetUserId },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: targetUserId },
    }),
    prisma.projectMember.deleteMany({
      where: { userId: targetUserId },
    }),
    prisma.task.updateMany({
      where: { assigneeId: targetUserId },
      data: { assigneeId: null },
    }),
    prisma.user.delete({
      where: { id: targetUserId },
    }),
  ]);

  return true;
}
