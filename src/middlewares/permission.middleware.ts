// ─── Permission Middleware ──────────────────────────────────────────
// Gates routes by staff_profiles permission fields.

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { sendError } from '../lib/api-response';

export type PermissionModule = 'orders' | 'menu' | 'reports' | 'settings' | 'staff' | 'customers' | 'branches' | 'pos';
export type RequiredLevel = 'View' | 'Create' | 'Edit' | 'Delete';

export function requirePermission(module: PermissionModule, level: RequiredLevel = 'View') {
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
        hasAccess = userLevel.map(l => l.toLowerCase()).includes(level.toLowerCase());
      } else if (typeof userLevel === 'string') {
        // Fallback for legacy roles (if userLevel is 'manage' or 'all', allow everything, if 'read' allow View)
        const legacyLevel = userLevel.toUpperCase();
        if (legacyLevel === 'MANAGE' || legacyLevel === 'ALL') hasAccess = true;
        if (level === 'View' && legacyLevel === 'READ') hasAccess = true;
        if (legacyLevel === 'USE' && level === 'Create') hasAccess = true;
        if (legacyLevel === 'USE' && level === 'View') hasAccess = true;
      }

      if (!hasAccess) {
        sendError(res, 403, 'INSUFFICIENT_PERMISSION', `Requires ${level} access on ${module}`);
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
