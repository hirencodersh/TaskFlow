import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../auth/auth.middleware.js';

import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask,
} from './task.service.js';

import {
  createTaskSchema,
  listTaskQuerySchema,
  updateTaskSchema,
} from './task.schema.js';

export async function create(req: Request, res: Response) {
  const result = createTaskSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  const user = req as AuthenticatedRequest;

  try {
    const task = await createTask(
      user.userId,
      user.userRole,
      result.data,
    );

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        task,
      },
    });
  } catch (error) {
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
      error.message === 'Developers cannot create tasks' ||
      error.message ===
        'Only the project owner or admin can create tasks'
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'Assignee must be a project member') {
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

export async function list(req: Request, res: Response) {
  const user = req as AuthenticatedRequest;

  const result = listTaskQuerySchema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: result.error.issues,
    });
  }

  try {
    const data = await getTasks(
      user.userId,
      user.userRole,
      result.data,
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

export async function getById(
  req: Request,
  res: Response,
) {
  const user = req as AuthenticatedRequest;

  try {
    const task = await getTaskById(
      user.userId,
      user.userRole,
      req.params.id!,
    );

    return res.status(200).json({
      success: true,
      data: {
        task,
      },
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }

    if (error.message === 'Task not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message ===
      'You do not have access to this task'
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
}

export async function update(
  req: Request,
  res: Response,
) {
  const result = updateTaskSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  const user = req as AuthenticatedRequest;

  try {
    const task = await updateTask(
      user.userId,
      user.userRole,
      req.params.id!,
      result.data,
    );

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: {
        task,
      },
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }

    if (error.message === 'Task not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === 'You do not have access to this task' ||
      error.message ===
        'Developers can only update tasks assigned to them' ||
      error.message ===
        'Developers can only update task status'
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'Assignee must be a project member') {
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

export async function remove(
  req: Request,
  res: Response,
) {
  const user = req as AuthenticatedRequest;

  try {
    await deleteTask(
      user.userId,
      user.userRole,
      req.params.id!,
    );

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }

    if (error.message === 'Task not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message ===
      'Only the project owner or admin can delete tasks'
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
}