import type { NextFunction, Request, Response } from 'express';

import { logger } from '../lib/logger.js';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  logger.error(error);

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}