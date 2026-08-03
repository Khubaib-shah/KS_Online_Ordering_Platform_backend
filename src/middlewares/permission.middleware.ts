// ─── Permission Middleware ──────────────────────────────────────────
// Gates routes by staff_profiles permission fields.

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { sendError } from '../lib/api-response';

type PermissionModule = 'orders' | 'menu' | 'reports' | 'settings';
type RequiredLevel = 'READ' | 'MANAGE';

const LEVEL_HIERARCHY: Record<string, number> = {
  NONE: 0,
  READ: 1,
  MANAGE: 2,
};

export function requirePermission(module: PermissionModule, level: RequiredLevel) {
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
        select: {
          permissionOrders: true,
          permissionMenu: true,
          permissionReports: true,
          permissionSettings: true,
        },
      });

      if (!staffProfile) {
        sendError(res, 403, 'NO_STAFF_PROFILE', 'No staff profile found for this user');
        return;
      }

      const fieldMap: Record<PermissionModule, string> = {
        orders: staffProfile.permissionOrders,
        menu: staffProfile.permissionMenu,
        reports: staffProfile.permissionReports,
        settings: staffProfile.permissionSettings,
      };

      const userLevel = fieldMap[module];
      if (LEVEL_HIERARCHY[userLevel] < LEVEL_HIERARCHY[level]) {
        sendError(res, 403, 'INSUFFICIENT_PERMISSION', `Requires ${level} access on ${module}`);
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
