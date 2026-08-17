import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../lib/api-response';
import { enforceBranchScope } from '../../middlewares/scope-resolver.middleware';

export const analyticsController = {
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filter, branchId, customStart, customEnd } = req.query as { filter: string; branchId?: string; customStart?: string; customEnd?: string };
      // Default to 'today' if no filter provided
      const finalFilter = filter || 'today';

      // Enforce branch scope
      const enforcedBranch = enforceBranchScope(req, res, branchId);
      if (enforcedBranch === '__BLOCKED__') return;

      let createdById: string | undefined;

      const stats = await analyticsService.getDashboardStats(req.tenantId!, finalFilter, enforcedBranch, req.user?.userId, createdById, customStart, customEnd);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  },
};
