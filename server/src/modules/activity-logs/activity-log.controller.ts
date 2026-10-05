import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../auth/auth.middleware.js';

import {
  activityLogQuerySchema,
} from './activity-log.schema.js';

import {
  getActivityLogs,
} from './activity-log.service.js';

export async function list(
  req: Request,
  res: Response,
) {
  const result = activityLogQuerySchema.safeParse(
    req.query,
  );

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  const user = req as AuthenticatedRequest;

  if (!result.data.projectId) {
    return res.status(400).json({
      success: false,
      message: 'projectId is required',
    });
  }

  try {
    const activityLogs = await getActivityLogs(
      user.userId,
      user.userRole,
      result.data.projectId,
      result.data.page,
      result.data.limit,
    );

    return res.status(200).json({
      success: true,
      data: activityLogs,
    });
  } catch (error) {
    return handleActivityLogError(res, error);
  }
}

function handleActivityLogError(
  res: Response,
  error: unknown,
) {
  if (!(error instanceof Error)) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }

  if (error.message === 'Project not found') {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }

  if (
    error.message ===
    'You do not have access to this project'
  ) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}