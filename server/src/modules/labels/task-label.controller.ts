import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../auth/auth.middleware.js';

import {
  addLabelToTask,
  getTaskLabels,
  removeLabelFromTask,
} from './task-label.service.js';

import { taskLabelActionSchema } from './task-label.schema.js';

export async function add(
  req: Request,
  res: Response,
) {
  const result = taskLabelActionSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  const user = req as AuthenticatedRequest;

  try {
    const taskLabel = await addLabelToTask(
      user.userId,
      user.userRole,
      req.params.taskId!,
      result.data.labelId,
    );

    return res.status(201).json({
      success: true,
      message: 'Label added to task successfully',
      data: {
        taskLabel,
      },
    });
  } catch (error) {
    return handleTaskLabelError(res, error);
  }
}

export async function list(
  req: Request,
  res: Response,
) {
  const user = req as AuthenticatedRequest;

  try {
    const taskLabels = await getTaskLabels(
      user.userId,
      user.userRole,
      req.params.taskId!,
    );

    return res.status(200).json({
      success: true,
      data: {
        taskLabels,
      },
    });
  } catch (error) {
    return handleTaskLabelError(res, error);
  }
}

export async function remove(
  req: Request,
  res: Response,
) {
  const result = taskLabelActionSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  const user = req as AuthenticatedRequest;

  try {
    await removeLabelFromTask(
      user.userId,
      user.userRole,
      req.params.taskId!,
      result.data.labelId,
    );

    return res.status(200).json({
      success: true,
      message: 'Label removed from task successfully',
    });
  } catch (error) {
    return handleTaskLabelError(res, error);
  }
}

function handleTaskLabelError(
  res: Response,
  error: unknown,
) {
  if (!(error instanceof Error)) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }

  const notFoundErrors = [
    'Task not found',
    'Label not found',
  ];

  if (notFoundErrors.includes(error.message)) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }

  const forbiddenErrors = [
    'You do not have access to this task',
  ];

  if (forbiddenErrors.includes(error.message)) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }

  const conflictErrors = [
    'Label is already assigned to this task',
  ];

  if (conflictErrors.includes(error.message)) {
    return res.status(409).json({
      success: false,
      message: error.message,
    });
  }

  if (
    error.message ===
    'Label does not belong to this task project'
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (
    error.message ===
    'Label is not assigned to this task'
  ) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}