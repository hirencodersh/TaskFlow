import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from './auth.middleware.js';
import { loginSchema, registerSchema } from './auth.schema.js';

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from './auth.service.js';

export async function register(req: Request, res: Response) {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: result.error.issues,
        });
    }

    try {
        const user = await registerUser(result.data);

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === 'Email already registered'
        ) {
            return res.status(409).json({
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

export async function login(req: Request, res: Response) {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: result.error.issues,
        });
    }

    try {
        const resultData = await loginUser(result.data);

        res.cookie('refreshToken', resultData.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/v1/auth',
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: resultData.user,
                accessToken: resultData.accessToken,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            (error.message === 'Invalid email or password' ||
                error.message === 'Account is inactive')
        ) {
            return res.status(401).json({
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

export async function refresh(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required',
    });
  }

  try {
    const result = await refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'Invalid refresh token' ||
        error.message === 'Account is inactive')
    ) {
      return res.status(401).json({
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

export async function logout(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await logoutUser(refreshToken);
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
  });

  return res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
}

export async function me(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).userId;

  try {
    const user = await getCurrentUser(userId);

    return res.status(200).json({
      success: true,
      message: 'Current user fetched successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'User not found' ||
        error.message === 'Account is inactive')
    ) {
      return res.status(401).json({
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