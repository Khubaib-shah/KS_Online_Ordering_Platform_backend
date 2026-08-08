import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../lib/api-response';

import { prisma } from '../../config/database';

export const analyticsController = {
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filter, branchId } = req.query as { filter: string; branchId?: string };
      // Default to 'today' if no filter provided
      const finalFilter = filter || 'today';
      
      let createdById: string | undefined;

      if (req.user && req.user.globalRole !== 'SUPER_ADMIN') {
        const staffProfile = await prisma.staffProfile.findUnique({
          where: { userId: req.user.userId },
          include: { role: true },
        });

        if (staffProfile && !staffProfile.isOwner && staffProfile.role?.permissions) {
          const perms = staffProfile.role.permissions as any;
          const reportsPerm = (perms.reports || perms.Reports || '').toString().toLowerCase();
          if (reportsPerm === 'self_only') {
            createdById = req.user.userId;
          }
        }
      }

      const stats = await analyticsService.getDashboardStats(req.tenantId!, finalFilter, branchId, req.user?.userId, createdById);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  },
};
