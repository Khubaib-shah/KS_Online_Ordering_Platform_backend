// ─── Zod Validation Middleware ───────────────────────────────────────
// Generic middleware that validates request body/params/query against a Zod schema.

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../lib/api-response';

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }
      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query) as any;
        Object.keys(req.query).forEach((key) => delete req.query[key]);
        Object.assign(req.query, parsedQuery);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request data', details);
        return;
      }
      next(error);
    }
  };
}
