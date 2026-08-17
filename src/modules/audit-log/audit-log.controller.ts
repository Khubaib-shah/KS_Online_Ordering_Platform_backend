// ─── Audit Log Controller ───────────────────────────────────────────
import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { auditLogService } from '../../lib/audit-log.service';
import { sendSuccess } from '../../lib/api-response';
import { parsePagination } from '../../lib/pagination';

export const auditLogController = {
  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const { action, actorId, targetType, startDate, endDate } = req.query as any;

      const result = await auditLogService.getByTenant(req.tenantId!, {
        page,
        limit,
        action,
        actorId,
        targetType,
        startDate,
        endDate,
        branchId: req.scope?.branchId || undefined,
      });

      sendSuccess(res, result.logs, 200, {
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
