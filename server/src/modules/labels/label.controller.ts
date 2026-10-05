import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../auth/auth.middleware.js';

import {
  createLabel,
  deleteLabel,
  getLabels,
  updateLabel,
} from './label.service.js';

import {
  createLabelSchema,
  updateLabelSchema,
} from './label.schema.js';

export async function create(
  req: Request,
  res: Response,
) {
  const result = createLabelSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  const user = req as AuthenticatedRequest;

  try {
    const label = await createLabel(
      user.userId,
      user.userRole,
      result.data,
    );

    return res.status(201).json({
      success: true,
      message: 'Label created successfully',
      data: {
        label,
      },
    });
  } catch (error) {
    return handleLabelError(res, error);
  }
}

export async function list(
  req: Request,
  res: Response,
) {
  const user = req as AuthenticatedRequest;

  try {
    const labels = await getLabels(
      user.userId,
      user.userRole,
      req.params.projectId!,
    );

    return res.status(200).json({
      success: true,
      data: {
        labels,
      },
    });
  } catch (error) {
    return handleLabelError(res, error);
  }
}

export async function update(
  req: Request,
  res: Response,
) {
  const result = updateLabelSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  const user = req as AuthenticatedRequest;

  try {
    const label = await updateLabel(
      user.userId,
      user.userRole,
      req.params.id!,
      result.data,
    );

    return res.status(200).json({
      success: true,
      message: 'Label updated successfully',
      data: {
        label,
      },
    });
  } catch (error) {
    return handleLabelError(res, error);
  }
}

export async function remove(
  req: Request,
  res: Response,
) {
  const user = req as AuthenticatedRequest;

  try {
    await deleteLabel(
      user.userId,
      user.userRole,
      req.params.id!,
    );

    return res.status(200).json({
      success: true,
      message: 'Label deleted successfully',
    });
  } catch (error) {
    return handleLabelError(res, error);
  }
}

function handleLabelError(
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
    'Project not found',
    'Label not found',
  ];

  if (notFoundErrors.includes(error.message)) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }

  const forbiddenErrors = [
    'You do not have access to this project',
    'Only the project owner or admin can create labels',
    'Only the project owner or admin can update labels',
    'Only the project owner or admin can delete labels',
  ];

  if (forbiddenErrors.includes(error.message)) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }

  if (
    error.message ===
    'A label with this name already exists in the project'
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