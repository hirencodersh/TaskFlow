import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../auth/auth.middleware.js';
import { listNotificationsQuerySchema } from './notification.schema.js';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from './notification.service.js';

export async function list(req: Request, res: Response) {
  const result = listNotificationsQuerySchema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  const currentUser = req as AuthenticatedRequest;

  try {
    const data = await getNotifications(currentUser.userId, result.data);
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

export async function markRead(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Notification ID is required',
    });
  }

  const currentUser = req as AuthenticatedRequest;

  try {
    const notification = await markNotificationAsRead(id, currentUser.userId);
    return res.status(200).json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Notification not found') {
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

export async function markAllRead(req: Request, res: Response) {
  const currentUser = req as AuthenticatedRequest;

  try {
    await markAllNotificationsAsRead(currentUser.userId);
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

export async function remove(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Notification ID is required',
    });
  }

  const currentUser = req as AuthenticatedRequest;

  try {
    await deleteNotification(id, currentUser.userId);
    return res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Notification not found') {
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
