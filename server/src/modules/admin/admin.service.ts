import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../utils/password.js';

import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
} from './admin.schema.js';

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

  const where = {
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
  userId: string,
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
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
      createdAt: true,
      updatedAt: true,
    },
  });
}