import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../auth/auth.middleware.js';
import { getDashboardAnalytics } from './analytics.service.js';

export async function getAnalytics(req: Request, res: Response) {
  const currentUser = req as AuthenticatedRequest;
  const { projectId, status, priority } = req.query as {
    projectId?: string;
    status?: string;
    priority?: string;
  };

  try {
    const data = await getDashboardAnalytics(
      currentUser.userId,
      currentUser.userRole,
      { projectId, status, priority },
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
