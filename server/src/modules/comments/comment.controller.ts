import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../auth/auth.middleware.js';

import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from './comment.service.js';

import {
  createCommentSchema,
  updateCommentSchema,
} from './comment.schema.js';

export async function create(
  req: Request,
  res: Response,
) {
  const result = createCommentSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  const user = req as AuthenticatedRequest;

  try {
    const comment = await createComment(
      user.userId,
      user.userRole,
      req.params.taskId!,
      result.data,
    );

    return res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: {
        comment,
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

export async function list(
  req: Request,
  res: Response,
) {
  const user = req as AuthenticatedRequest;

  try {
    const comments = await getComments(
      user.userId,
      user.userRole,
      req.params.taskId!,
    );

    return res.status(200).json({
      success: true,
      data: {
        comments,
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
  const result = updateCommentSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  const user = req as AuthenticatedRequest;

  try {
    const comment = await updateComment(
      user.userId,
      user.userRole,
      req.params.id!,
      result.data,
    );

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        comment,
      },
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }

    if (error.message === 'Comment not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message ===
      'You can only update your own comments'
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

export async function remove(
  req: Request,
  res: Response,
) {
  const user = req as AuthenticatedRequest;

  try {
    await deleteComment(
      user.userId,
      user.userRole,
      req.params.id!,
    );

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }

    if (error.message === 'Comment not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message ===
      'You can only delete your own comments'
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