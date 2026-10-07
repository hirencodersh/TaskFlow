import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import { logger } from '../lib/logger.js';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  // Always log the original error
  logger.error(error);

  // Prevent another error if headers were already sent
  if (res.headersSent) {
    return res;
  }

  // Multer errors
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(413).json({
          success: false,
          message: 'File size must not exceed 5MB',
        });

      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files uploaded',
        });

      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file uploaded',
        });

      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many form fields',
        });

      default:
        return res.status(400).json({
          success: false,
          message: error.message || 'File upload failed',
        });
    }
  }

  // Normal Error objects
  if (error instanceof Error) {
    // File type validation
    if (
      error.message ===
      'Only PNG, JPG, JPEG, PDF, DOCX and TXT files are allowed'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle errors that contain a status/statusCode
    const errorWithStatus = error as Error & {
      status?: number;
      statusCode?: number;
    };

    const statusCode =
      errorWithStatus.statusCode ||
      errorWithStatus.status ||
      500;

    const safeStatusCode =
      statusCode >= 400 && statusCode < 600 ? statusCode : 500;

    return res.status(safeStatusCode).json({
      success: false,
      message:
        safeStatusCode === 500
          ? 'Internal server error'
          : error.message,
    });
  }

  // Unknown errors
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}