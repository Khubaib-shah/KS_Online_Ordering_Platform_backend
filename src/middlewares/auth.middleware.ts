// ─── Auth Middleware ────────────────────────────────────────────────
// JWT verification for staff/tenant-admin/super-admin routes.
// Reads JWT from httpOnly cookie (primary) or Authorization header (fallback).

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { PLATFORM_NAME } from '../config/constants';
import { sendError } from '../lib/api-response';

export interface JwtPayload {
  userId: string;
  email: string;
  tenantId: string | null;
  globalRole: 'SUPER_ADMIN' | 'TENANT_USER';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction): void {
  try {
    // 1. Try httpOnly cookie first (preferred — not accessible from JS)
    let token = req.cookies?.[`${PLATFORM_NAME.toLowerCase()}_token`];

    // 2. Fallback to Authorization header (backward compatibility)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    sendError(res, 401, 'INVALID_TOKEN', 'Invalid or expired token');
  }
}

export function superAdminOnly(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.globalRole !== 'SUPER_ADMIN') {
    sendError(res, 403, 'FORBIDDEN', 'Super admin access required');
    return;
  }
  next();
}

