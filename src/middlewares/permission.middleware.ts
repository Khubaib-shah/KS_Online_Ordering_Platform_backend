// ─── Permission Middleware ──────────────────────────────────────────
// Gates routes by staff_profiles permission fields.
// Also attaches req.staffProfile for downstream middleware (resolveScope).

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { sendError } from '../lib/api-response';
import { validatePermissionRegistration } from './permission-registry';

// Extend Express Request to include staffProfile for downstream use
declare global {
  namespace Express {
    interface Request {
      staffProfile?: {
        id: string;
        userId: string;
        branchId: string | null;
        isOwner: boolean;
        roleId: string | null;
        role: {
          id: string;
          name: string;
          permissions: any;
          rank: number;
          scope?: string;
        } | null;
      };
      scope?: {
        tenantId: string;
        branchId: string | null;
      };
    }
  }
}

export function requirePermission(module: string, action: string = 'View') {
  // Validate at startup that this module/action combination is valid
  validatePermissionRegistration(module, action);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
        return;
      }

      // Super admins bypass permission checks entirely
      if (req.user.globalRole === 'SUPER_ADMIN') {
        return next();
      }

      const staffProfile = await prisma.staffProfile.findUnique({
        where: { userId: req.user.userId },
        include: { role: true },
      });

      if (!staffProfile) {
        sendError(res, 403, 'NO_STAFF_PROFILE', 'No staff profile found for this user');
        return;
      }

      // Attach staffProfile to req for downstream middleware (resolveScope)
      req.staffProfile = {
        id: staffProfile.id,
        userId: staffProfile.userId,
        branchId: staffProfile.branchId,
        isOwner: staffProfile.isOwner,
        roleId: staffProfile.roleId,
        role: staffProfile.role ? {
          id: staffProfile.role.id,
          name: staffProfile.role.name,
          permissions: staffProfile.role.permissions,
          rank: (staffProfile.role as any).rank ?? 0,
          scope: (staffProfile.role as any).scope ?? 'BRANCH',
        } : null,
      };

      if (staffProfile.isOwner) {
        return next();
      }

      if (!staffProfile.role || !staffProfile.role.permissions) {
         sendError(res, 403, 'INSUFFICIENT_PERMISSION', `No role or permissions assigned`);
         return;
      }

      const perms = staffProfile.role.permissions as Record<string, any>;
      // Case-insensitive module matching
      const moduleKey = Object.keys(perms).find(k => k.toLowerCase() === module.toLowerCase());
      const userLevel = moduleKey ? perms[moduleKey] : [];

      // Support for both legacy string permissions (e.g. 'manage', 'all') and new array permissions
      let hasAccess = false;
      if (Array.isArray(userLevel)) {
        hasAccess = userLevel.map(l => l.toLowerCase()).includes(action.toLowerCase());
      } else if (typeof userLevel === 'string') {
        // Fallback for legacy roles (if userLevel is 'manage' or 'all', allow everything, if 'read' allow View)
        const legacyLevel = userLevel.toUpperCase();
        if (legacyLevel === 'MANAGE' || legacyLevel === 'ALL') hasAccess = true;
        if (action === 'View' && (legacyLevel === 'READ' || legacyLevel === 'BRANCH_ONLY' || legacyLevel === 'SELF_ONLY')) hasAccess = true;
        if (legacyLevel === 'USE' && (action === 'Create' || action === 'View')) hasAccess = true;
      }

      if (!hasAccess) {
        sendError(res, 403, 'INSUFFICIENT_PERMISSION', `Requires ${action} access on ${module}`);
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
