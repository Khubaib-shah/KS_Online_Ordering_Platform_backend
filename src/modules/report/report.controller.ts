// ─── Report Controller ──────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import { reportService } from './report.service';
import { sendSuccess } from '../../lib/api-response';
import { enforceBranchScope } from '../../middlewares/scope-resolver.middleware';

export const reportController = {
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let { period, branchId, cashierId } = req.query as { period: string; branchId?: string; cashierId?: string };
      
      // Enforce branch scope
      const enforcedBranch = enforceBranchScope(req, res, branchId);
      if (enforcedBranch === '__BLOCKED__') return;

      let createdById: string | undefined = cashierId;

      const summary = await reportService.getSummary(req.tenantId!, period, enforcedBranch, req.user?.userId, createdById);
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  },
};
