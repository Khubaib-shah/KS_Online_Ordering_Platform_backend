// ─── Tenant Resolver Middleware ──────────────────────────────────────
// Resolves tenant from a trusted host/public route, not client-supplied headers.

import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { cacheGetOrSet } from "../lib/cache";
import { sendError } from "../lib/api-response";
import { normalizeTenantHost } from "../lib/tenant-context";

// Extend Express Request to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenantSlug?: string;
    }
  }
}

export function tenantResolver(
  options: { required?: boolean } = { required: true },
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const switchTenantId =
        typeof req.query.switchTenantId === "string"
          ? req.query.switchTenantId
          : undefined;
      const switchTenantSlug =
        typeof req.query.switchTenantSlug === "string"
          ? req.query.switchTenantSlug
          : undefined;

      const isSuperAdminSwitch = Boolean(
        req.user?.globalRole === "SUPER_ADMIN" &&
        (switchTenantId || switchTenantSlug),
      );
      let requestedSlug = isSuperAdminSwitch
        ? switchTenantSlug
        : normalizeTenantHost(
            (req.headers["x-forwarded-host"] as string | undefined) ||
              (req.headers.host as string | undefined) ||
              req.hostname,
          );
      let requestedTenantId = isSuperAdminSwitch ? switchTenantId : undefined;

      if (!requestedSlug && !requestedTenantId) {
        requestedSlug = req.headers["x-tenant-slug"] as string | undefined;
        requestedTenantId = req.headers["x-tenant-id"] as string | undefined;
        
        if (!requestedSlug && !requestedTenantId && req.user?.tenantId) {
           requestedTenantId = req.user.tenantId;
        }
      }

      if (!requestedSlug && !requestedTenantId) {
        if (options.required) {
          sendError(
            res,
            400,
            "TENANT_REQUIRED",
            "Tenant resolution is required. Public routes are bound to the trusted host/domain.",
          );
          return;
        }
        return next();
      }

      const cacheKey = requestedSlug
        ? `tenant:slug:${requestedSlug}`
        : `tenant:id:${requestedTenantId}`;
      const tenant = await cacheGetOrSet(
        cacheKey,
        async () => {
          const where = requestedSlug
            ? { slug: requestedSlug }
            : { id: requestedTenantId! };
          return prisma.tenant.findUnique({
            where,
            select: { id: true, slug: true, status: true },
          });
        },
        300,
      );

      if (!tenant) {
        sendError(
          res,
          404,
          "TENANT_NOT_FOUND",
          `Tenant '${requestedSlug || requestedTenantId}' not found`,
        );
        return;
      }

      if (tenant.status === "SUSPENDED") {
        sendError(
          res,
          403,
          "TENANT_SUSPENDED",
          "This tenant account has been suspended",
        );
        return;
      }

      req.tenantId = tenant.id;
      req.tenantSlug = tenant.slug;

      if (req.user && req.user.globalRole !== "SUPER_ADMIN") {
        if (req.tenantId !== req.user.tenantId) {
          sendError(
            res,
            403,
            "FORBIDDEN_TENANT",
            "Access to this tenant is unauthorized",
          );
          return;
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
