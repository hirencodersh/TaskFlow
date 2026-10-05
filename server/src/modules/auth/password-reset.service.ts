import crypto from 'crypto';

import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../utils/password.js';

const RESET_TOKEN_EXPIRY_MINUTES = 30;

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  // Do not reveal whether the email exists.
  if (!user) {
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');

  const tokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const expiresAt = new Date(
    Date.now() +
      RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
  );

  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      usedAt: null,
    },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  // Development only.
  // Later this token will be sent through email.
  return rawToken;
}

export async function resetPassword(
  rawToken: string,
  newPassword: string,
) {
  const tokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const resetToken =
    await prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
    });

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt < new Date()
  ) {
    throw new Error('Invalid or expired reset token');
  }

  const passwordHash = await hashPassword(
    newPassword,
  );

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: resetToken.userId,
      },
      data: {
        passwordHash,
      },
    }),

    prisma.passwordResetToken.update({
      where: {
        id: resetToken.id,
      },
      data: {
        usedAt: new Date(),
      },
    }),

    prisma.refreshToken.updateMany({
      where: {
        userId: resetToken.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    }),
  ]);
}