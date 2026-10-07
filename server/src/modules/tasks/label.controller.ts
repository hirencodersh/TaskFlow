import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../auth/auth.middleware.js';

import {
  createLabel,
  getProjectLabels,
  updateLabel,
  deleteLabel,
  assignLabelToTask,
  removeLabelFromTask,
} from './label.service.js';

function getAuthUser(req: Request) {
  return req as AuthenticatedRequest;
}

export async function create(
  req: Request,
  res: Response,
) {
  const user = getAuthUser(req);

  const {
    projectId,
    name,
    color,
  } = req.body;

  if (!projectId || !name || !color) {
    return res.status(400).json({
      success: false,
      message:
        'Project ID, name and color are required',
    });
  }

  try {
    const label = await createLabel(
      user.userId,
      user.userRole,
      projectId,
      name,
      color,
    );

    return res.status(201).json({
      success: true,
      message: 'Label created successfully',
      data: {
        label,
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
      error.message === 'Project not found'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes(
        'Developers cannot create labels',
      ) ||
      error.message.includes(
        'Only the project owner or admin can create labels',
      )
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes(
        'already exists',
      )
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

export async function list(
  req: Request,
  res: Response,
) {
  const user = getAuthUser(req);
  const projectId = req.params.projectId;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: 'Project ID is required',
    });
  }

  try {
    const labels = await getProjectLabels(
      user.userId,
      user.userRole,
      projectId,
    );

    return res.status(200).json({
      success: true,
      message: 'Project labels fetched successfully',
      data: {
        labels,
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
      error.message === 'Project not found'
    ) {
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
}

export async function update(
  req: Request,
  res: Response,
) {
  const user = getAuthUser(req);
  const labelId = req.params.id;

  const {
    name,
    color,
  } = req.body;

  if (!labelId) {
    return res.status(400).json({
      success: false,
      message: 'Label ID is required',
    });
  }

  if (!name || !color) {
    return res.status(400).json({
      success: false,
      message:
        'Name and color are required',
    });
  }

  try {
    const label = await updateLabel(
      user.userId,
      user.userRole,
      labelId,
      name,
      color,
    );

    return res.status(200).json({
      success: true,
      message: 'Label updated successfully',
      data: {
        label,
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
      error.message === 'Label not found'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes(
        'Developers cannot update labels',
      ) ||
      error.message.includes(
        'Only the project owner or admin can update labels',
      )
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes(
        'already exists',
      )
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

export async function remove(
  req: Request,
  res: Response,
) {
  const user = getAuthUser(req);
  const labelId = req.params.id;

  if (!labelId) {
    return res.status(400).json({
      success: false,
      message: 'Label ID is required',
    });
  }

  try {
    await deleteLabel(
      user.userId,
      user.userRole,
      labelId,
    );

    return res.status(200).json({
      success: true,
      message: 'Label deleted successfully',
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }

    if (
      error.message === 'Label not found'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes(
        'Developers cannot delete labels',
      ) ||
      error.message.includes(
        'Only the project owner or admin can delete labels',
      )
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

export async function assign(
  req: Request,
  res: Response,
) {
  const user = getAuthUser(req);

  const taskId = req.params.taskId;
  const { labelId } = req.body;

  if (!taskId) {
    return res.status(400).json({
      success: false,
      message: 'Task ID is required',
    });
  }

  if (!labelId) {
    return res.status(400).json({
      success: false,
      message: 'Label ID is required',
    });
  }

  try {
    const taskLabel =
      await assignLabelToTask(
        user.userId,
        user.userRole,
        taskId,
        labelId,
      );

    return res.status(201).json({
      success: true,
      message: 'Label assigned to task successfully',
      data: {
        taskLabel,
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
      error.message === 'Task not found' ||
      error.message === 'Label not found'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes(
        'Developers cannot assign labels',
      ) ||
      error.message.includes(
        'Only the project owner or admin can assign labels',
      )
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes(
        'Label does not belong to the task project',
      )
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes(
        'already assigned',
      )
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

export async function removeFromTask(
  req: Request,
  res: Response,
) {
  const user = getAuthUser(req);

  const taskId = req.params.taskId;
  const labelId = req.params.labelId;

  if (!taskId || !labelId) {
    return res.status(400).json({
      success: false,
      message:
        'Task ID and Label ID are required',
    });
  }

  try {
    await removeLabelFromTask(
      user.userId,
      user.userRole,
      taskId,
      labelId,
    );

    return res.status(200).json({
      success: true,
      message: 'Label removed from task successfully',
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }

    if (
      error.message === 'Task not found'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes(
        'Developers cannot remove labels',
      ) ||
      error.message.includes(
        'Only the project owner or admin can remove labels',
      )
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes(
        'not assigned to this task',
      )
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