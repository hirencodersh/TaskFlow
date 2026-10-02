import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';

export type AuthenticatedRequest = Request & {
  userId: string;
  userRole: 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';
};

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const accessToken = authorization.substring(7);

  try {
    const decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET);

    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof decoded.userId !== 'string'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token',
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    const authenticatedRequest = req as AuthenticatedRequest;

    authenticatedRequest.userId = user.id;
    authenticatedRequest.userRole = user.role;

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired access token',
    });
  }
}