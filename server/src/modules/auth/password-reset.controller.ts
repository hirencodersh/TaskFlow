import type { Request, Response } from 'express';

import { passwordSchema } from './auth.schema.js';
import {
  requestPasswordReset,
  resetPassword,
} from './password-reset.service.js';

export async function requestReset(
  req: Request,
  res: Response,
) {
  const { email } = req.body;

  if (
    typeof email !== 'string' ||
    !email.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  try {
    const resetToken =
      await requestPasswordReset(
        email.trim().toLowerCase(),
      );

    return res.status(200).json({
      success: true,
      message:
        'If the email exists, a password reset token has been generated',
      ...(resetToken
        ? { resetToken }
        : {}),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

export async function reset(
  req: Request,
  res: Response,
) {
  const { token, newPassword } = req.body;

  if (
    typeof token !== 'string' ||
    !token.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: 'Reset token is required',
    });
  }

  const passwordResult =
    passwordSchema.safeParse(newPassword);

  if (!passwordResult.success) {
    return res.status(400).json({
      success: false,
      message:
        passwordResult.error.issues[0]?.message ??
        'Invalid password',
    });
  }

  try {
    await resetPassword(
      token.trim(),
      passwordResult.data,
    );

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        'Invalid or expired reset token'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}