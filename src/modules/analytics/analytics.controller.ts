import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../lib/api-response';

export const analyticsController = {
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filter, branchId } = req.query as { filter: string; branchId?: string };
      // Default to 'today' if no filter provided
      const finalFilter = filter || 'today';
      
      const stats = await analyticsService.getDashboardStats(req.tenantId!, finalFilter, branchId);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  },
};
