// ─── Report Controller ──────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import { reportService } from './report.service';
import { sendSuccess } from '../../lib/api-response';

import { prisma } from '../../config/database';

export const reportController = {
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let { period, branchId, cashierId } = req.query as { period: string; branchId?: string; cashierId?: string };
      
      let createdById: string | undefined = cashierId;

      if (req.user && req.user.globalRole !== 'SUPER_ADMIN') {
        const staffProfile = await prisma.staffProfile.findUnique({
          where: { userId: req.user.userId },
          include: { role: true },
        });


      }

      const summary = await reportService.getSummary(req.tenantId!, period, branchId, req.user?.userId, createdById);
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  },
};
