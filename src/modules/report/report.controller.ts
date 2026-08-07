// ─── Report Controller ──────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import { reportService } from './report.service';
import { sendSuccess } from '../../lib/api-response';

export const reportController = {
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period, branchId } = req.query as { period: string; branchId?: string };
      const summary = await reportService.getSummary(req.tenantId!, period, branchId, req.user?.userId);
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  },
};
