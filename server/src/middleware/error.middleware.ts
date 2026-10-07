import type { Request, Response } from 'express';
import multer from 'multer';

import { logger } from '../lib/logger.js';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
) {
  logger.error(error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File size must not exceed 5MB',
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof Error) {
    if (
      error.message ===
      'Only PNG, JPG, JPEG, PDF, DOCX and TXT files are allowed'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}