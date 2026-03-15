// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Error Handler Middleware
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../lib/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
  });
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Known application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.code && { code: err.code }),
    });
    return;
  }

  // Unknown errors
  logger.error(
    {
      err,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.sub,
    },
    'Unhandled error',
  );

  res.status(500).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
}
