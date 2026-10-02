import { prisma } from '../../lib/prisma.js';

import { comparePassword, hashPassword } from '../../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../../utils/jwt.js';

import type { LoginInput, RegisterInput } from './auth.schema.js';

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email.toLowerCase(),
    },
  });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: 'DEVELOPER',
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

  return user;
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email.toLowerCase(),
    },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    throw new Error('Account is inactive');
  }

  const passwordMatches = await comparePassword(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new Error('Invalid email or password');
  }

  const accessToken = generateAccessToken({
    userId: user.id,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
  });

  const refreshTokenHash = await hashPassword(refreshToken);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const { verifyRefreshToken, generateAccessToken } = await import(
    '../../utils/jwt.js'
  );

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new Error('Invalid refresh token');
  }

  const storedTokens = await prisma.refreshToken.findMany({
    where: {
      userId: payload.userId,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  for (const storedToken of storedTokens) {
    const matches = await comparePassword(
      refreshToken,
      storedToken.tokenHash,
    );

    if (matches) {
      const user = await prisma.user.findUnique({
        where: {
          id: payload.userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new Error('Account is inactive');
      }

      const accessToken = generateAccessToken({
        userId: user.id,
      });

      return {
        user,
        accessToken,
      };
    }
  }

  throw new Error('Invalid refresh token');
}

export async function logoutUser(refreshToken: string) {
  const storedTokens = await prisma.refreshToken.findMany({
    where: {
      revokedAt: null,
    },
  });

  for (const storedToken of storedTokens) {
    const matches = await comparePassword(
      refreshToken,
      storedToken.tokenHash,
    );

    if (matches) {
      await prisma.refreshToken.update({
        where: {
          id: storedToken.id,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      return;
    }
  }
}

export async function getCurrentUser(userId: string) {
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

  if (!user.isActive) {
    throw new Error('Account is inactive');
  }

  return user;
}