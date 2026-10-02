
import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../auth/auth.middleware.js';

import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
} from './project.service.js';

import {
  createProjectSchema,
  updateProjectSchema,
} from './project.schema.js';

export async function create(req: Request, res: Response) {
  const result = createProjectSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  const user = req as AuthenticatedRequest;

  try {
    const project = await createProject(
      user.userId,
      user.userRole,
      result.data,
    );

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Developers cannot create projects'
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

export async function list(req: Request, res: Response) {
  const user = req as AuthenticatedRequest;

  try {
    const projects = await getProjects(
      user.userId,
      user.userRole,
    );

    return res.status(200).json({
      success: true,
      message: 'Projects fetched successfully',
      data: {
        projects,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

export async function getById(req: Request, res: Response) {
  const user = req as AuthenticatedRequest;
  const projectId = req.params.id;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: 'Project ID is required',
    });
  }

  try {
    const project = await getProjectById(
      projectId,
      user.userId,
      user.userRole,
    );

    return res.status(200).json({
      success: true,
      message: 'Project fetched successfully',
      data: {
        project,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Project not found'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message === 'You do not have access to this project'
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

export async function update(req: Request, res: Response) {
  const result = updateProjectSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  const user = req as AuthenticatedRequest;
  const projectId = req.params.id;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: 'Project ID is required',
    });
  }

  try {
    const project = await updateProject(
      projectId,
      user.userId,
      user.userRole,
      result.data,
    );

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Project not found'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        'Only the project owner or admin can update this project'
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

export async function remove(req: Request, res: Response) {
  const user = req as AuthenticatedRequest;
  const projectId = req.params.id;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: 'Project ID is required',
    });
  }

  try {
    await deleteProject(
      projectId,
      user.userId,
      user.userRole,
    );

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Project not found'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        'Only the project owner or admin can delete this project'
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

