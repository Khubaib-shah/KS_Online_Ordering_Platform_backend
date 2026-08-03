// ─── Global Error Handler Middleware ────────────────────────────────
// Single place that formats all error responses.

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';
import { sendError } from '../lib/api-response';
import { logger } from '../config/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // Log the error
  logger.error(err.message, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    ...(err instanceof AppError && { code: err.code, statusCode: err.statusCode }),
  });

  // AppError — operational errors with known status/code
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message);
    return;
  }

  // Prisma known errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      sendError(res, 409, 'CONFLICT', `A record with this value already exists (${prismaErr.meta?.target})`);
      return;
    }
    if (prismaErr.code === 'P2025') {
      sendError(res, 404, 'NOT_FOUND', 'The requested record was not found');
      return;
    }
  }

  // Unknown / unexpected errors
  sendError(
    res,
    500,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  );
}
