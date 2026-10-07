import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../auth/auth.middleware.js';

import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from './admin.schema.js';

import {
  createUser,
  getUserById,
  getUsers,
  updateUserRole,
  updateUserStatus,
} from './admin.service.js';

export async function list(
  req: Request,
  res: Response,
) {
  const result = listUsersQuerySchema.safeParse(
    req.query,
  );

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  try {
    const users = await getUsers(result.data);

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

export async function getOne(
  req: Request,
  res: Response,
) {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required',
    });
  }

  try {
    const user = await getUserById(userId);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'User not found'
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
}

export async function updateRole(
  req: Request,
  res: Response,
) {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required',
    });
  }

  const result = updateUserRoleSchema.safeParse(
    req.body,
  );

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  try {
    const user = await updateUserRole(
      userId,
      result.data,
    );

    return res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'User not found'
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
}

export async function updateStatus(
  req: Request,
  res: Response,
) {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required',
    });
  }

  const result =
    updateUserStatusSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  const currentUser =
    req as AuthenticatedRequest;

  try {
    const user = await updateUserStatus(
      userId,
      result.data,
      currentUser.userId,
    );

    return res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'User not found'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        'You cannot deactivate your own account'
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

export async function create(
  req: Request,
  res: Response,
) {
  const result = createUserSchema.safeParse(
    req.body,
  );

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  try {
    const user = await createUser(result.data);

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Email is already in use'
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