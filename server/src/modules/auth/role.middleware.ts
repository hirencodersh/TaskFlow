import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedRequest } from './auth.middleware.js';

type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export function requireRole(...allowedRoles: UserRole[]) {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const user = req as AuthenticatedRequest & {
      userRole?: UserRole;
    };

    if (!user.userRole) {
      return res.status(403).json({
        success: false,
        message: 'Role information is required',
      });
    }

    if (!allowedRoles.includes(user.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }

    return next();
  };
}