
import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../auth/auth.middleware.js';

import {
  addProjectMember,
  createProject,
  deleteProject,
  getAvailableProjectUsers,
  getProjectById,
  getProjectMembers,
  getProjects,
  removeProjectMember,
  updateProject,
} from './project.service.js';

import {
  addProjectMemberSchema,
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

export async function getAvailableUsers(
  req: Request,
  res: Response,
) {
  const user = req as AuthenticatedRequest;
  const projectId = req.params.projectId;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: 'Project ID is required',
    });
  }

  try {
    const users =
      await getAvailableProjectUsers(
        projectId,
        user.userId,
        user.userRole,
      );

    return res.status(200).json({
      success: true,
      message:
        'Available project users fetched successfully',
      data: {
        users,
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
      error.message ===
        'Developers cannot access available project users' ||
      error.message ===
        'Only the project owner or admin can access available project users'
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
    console.error('DELETE PROJECT ERROR:', error);

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

export async function addMember(req: Request, res: Response) {
  const result = addProjectMemberSchema.safeParse(req.body);

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
    const member = await addProjectMember(
      projectId,
      result.data.userId,
      user.userId,
      user.userRole,
    );

    return res.status(201).json({
      success: true,
      message: 'Project member added successfully',
      data: {
        member,
      },
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }

    if (
      error.message === 'Project not found' ||
      error.message === 'User not found'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === 'Developers cannot manage project members' ||
      error.message ===
      'Only the project owner or admin can manage project members'
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === 'User account is inactive' ||
      error.message === 'User is already a project member'
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
}

export async function getMembers(req: Request, res: Response) {
  const user = req as AuthenticatedRequest;
  const projectId = req.params.id;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: 'Project ID is required',
    });
  }

  try {
    const members = await getProjectMembers(
      projectId,
      user.userId,
      user.userRole,
    );

    return res.status(200).json({
      success: true,
      message: 'Project members fetched successfully',
      data: {
        members,
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

    if (error.message === 'You do not have access to this project') {
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

export async function removeMember(req: Request, res: Response) {
  const user = req as AuthenticatedRequest;
  const projectId = req.params.id;
  const memberUserId = req.params.userId;

  if (!projectId || !memberUserId) {
    return res.status(400).json({
      success: false,
      message: 'Project ID and user ID are required',
    });
  }

  try {
    await removeProjectMember(
      projectId,
      memberUserId,
      user.userId,
      user.userRole,
    );

    return res.status(200).json({
      success: true,
      message: 'Project member removed successfully',
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }

    if (
      error.message === 'Project not found' ||
      error.message === 'Project member not found'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === 'Developers cannot manage project members' ||
      error.message ===
      'Only the project owner or admin can manage project members'
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'Project owner cannot be removed') {
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