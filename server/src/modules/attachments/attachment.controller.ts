import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../auth/auth.middleware.js';

import {
  createAttachmentRecord,
  deleteAttachment,
  getAttachments,
  getTaskForAttachment,
  uploadAttachmentToCloudinary,
} from './attachment.service.js';

export async function upload(
  req: Request,
  res: Response,
) {
  const user = req as AuthenticatedRequest;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'File is required',
    });
  }

  try {
    await getTaskForAttachment(
      user.userId,
      user.userRole,
      req.params.taskId!,
    );

    const cloudinaryResult =
      await uploadAttachmentToCloudinary(req.file);

    const attachment = await createAttachmentRecord(
      req.params.taskId!,
      user.userId,
      {
        url: cloudinaryResult.url,
        publicId: cloudinaryResult.publicId,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    );

    return res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: {
        attachment,
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

    console.error('Attachment upload error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to upload attachment',
    });
  }
}

export async function list(
  req: Request,
  res: Response,
) {
  const user = req as AuthenticatedRequest;

  try {
    const attachments = await getAttachments(
      user.userId,
      user.userRole,
      req.params.taskId!,
    );

    return res.status(200).json({
      success: true,
      data: {
        attachments,
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

export async function remove(
  req: Request,
  res: Response,
) {
  const user = req as AuthenticatedRequest;

  try {
    await deleteAttachment(
      user.userId,
      user.userRole,
      req.params.id!,
    );

    return res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }

    if (error.message === 'Attachment not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message ===
      'You do not have permission to delete this attachment'
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Attachment delete error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete attachment',
    });
  }
}