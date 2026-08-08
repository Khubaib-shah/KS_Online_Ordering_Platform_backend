// ─── Permission Middleware ──────────────────────────────────────────
// Gates routes by staff_profiles permission fields.

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { sendError } from '../lib/api-response';

export type PermissionModule = 'orders' | 'menu' | 'reports' | 'settings' | 'staff' | 'customers' | 'branches' | 'pos';
export type RequiredLevel = 'READ' | 'MANAGE' | 'USE' | 'BRANCH_ONLY' | 'SELF_ONLY' | 'ALL';

// Maps requested minimum level to an array of allowed JSON values (in uppercase)
const LEVEL_MAP: Record<RequiredLevel, string[]> = {
  READ: ['READ', 'MANAGE', 'BRANCH_ONLY', 'SELF_ONLY', 'ALL'],
  MANAGE: ['MANAGE', 'ALL'],
  USE: ['USE', 'MANAGE'],
  BRANCH_ONLY: ['BRANCH_ONLY', 'ALL', 'MANAGE'],
  SELF_ONLY: ['SELF_ONLY', 'BRANCH_ONLY', 'ALL', 'MANAGE'],
  ALL: ['ALL', 'MANAGE']
};

export function requirePermission(module: PermissionModule, level: RequiredLevel = 'READ') {
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

      const perms = staffProfile.role.permissions as Record<string, string>;
      const userLevel = (perms[module] || 'NONE').toUpperCase();

      if (userLevel === 'NONE' || !LEVEL_MAP[level].includes(userLevel)) {
        sendError(res, 403, 'INSUFFICIENT_PERMISSION', `Requires ${level} access on ${module}`);
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
