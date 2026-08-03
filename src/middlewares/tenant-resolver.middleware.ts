// ─── Tenant Resolver Middleware ──────────────────────────────────────
// Resolves tenant from X-Tenant-Slug header or query param, attaches to req.

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { cacheGetOrSet } from '../lib/cache';
import { sendError } from '../lib/api-response';

// Extend Express Request to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenantSlug?: string;
    }
  }
}

export function tenantResolver(options: { required?: boolean } = { required: true }) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Try multiple resolution strategies
      const slug =
        (req.headers['x-tenant-slug'] as string) ||
        (req.query.tenantSlug as string) ||
        (req.query.slug as string);

      const tenantId =
        (req.headers['x-tenant-id'] as string) ||
        (req.query.tenantId as string);

      if (!slug && !tenantId) {
        if (options.required) {
          sendError(res, 400, 'TENANT_REQUIRED', 'Tenant identification is required. Provide X-Tenant-Slug header or tenantSlug query param.');
          return;
        }
        return next();
      }

      // Cache tenant resolution for 5 minutes
      const cacheKey = slug ? `tenant:slug:${slug}` : `tenant:id:${tenantId}`;
      const tenant = await cacheGetOrSet(
        cacheKey,
        async () => {
          const where = slug ? { slug } : { id: tenantId! };
          return prisma.tenant.findUnique({
            where,
            select: { id: true, slug: true, status: true },
          });
        },
        300
      );

      if (!tenant) {
        sendError(res, 404, 'TENANT_NOT_FOUND', `Tenant '${slug || tenantId}' not found`);
        return;
      }

      if (tenant.status === 'SUSPENDED') {
        sendError(res, 403, 'TENANT_SUSPENDED', 'This tenant account has been suspended');
        return;
      }
      req.tenantId = tenant.id;
      req.tenantSlug = tenant.slug;

      // Tenant isolation guard check:
      if (req.user && req.user.globalRole !== 'SUPER_ADMIN') {
        if (req.tenantId !== req.user.tenantId) {
          sendError(res, 403, 'FORBIDDEN_TENANT', 'Access to this tenant is unauthorized');
          return;
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
