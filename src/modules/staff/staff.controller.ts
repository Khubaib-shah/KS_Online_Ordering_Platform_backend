import { Request as ExpressRequest, Response, NextFunction } from "express";
type Request = ExpressRequest<any>;
import { staffService } from "./staff.service";
import { sendSuccess, sendPaginated, sendError } from "../../lib/api-response";
import { parsePagination } from "../../lib/pagination";
import { auditLogService } from "../../lib/audit-log.service";

export const staffController = {
  async listStaff(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const { staff, total } = await staffService.list(
        req.tenantId!,
        page,
        limit,
      );
      sendPaginated(res, staff, total, page, limit);
    } catch (error) {
      next(error);
    }
  },

  async inviteStaff(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await staffService.invite(req.tenantId!, req.body, req.user?.userId);
      sendSuccess(res, user, 201);
    } catch (error) {
      next(error);
    }
  },

  async updatePermissions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const staff = await staffService.updatePermissions(
        req.params.id,
        req.tenantId!,
        req.body,
        req.user?.userId,
      );
      sendSuccess(res, staff);
    } catch (error) {
      next(error);
    }
  },

  async deactivateStaff(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await staffService.deactivate(req.params.userId, req.tenantId!, req.user?.userId);
      sendSuccess(res, { deactivated: true });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /team/:id/activity
   * Returns staff profile + paginated audit log for the specified staff member.
   */
  async getStaffActivity(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const staffProfile = await staffService.getById(req.params.id, req.tenantId!);
      if (!staffProfile) {
        sendError(res, 404, 'NOT_FOUND', 'Staff member not found');
        return;
      }

      // Branch scope check: if actor is branch-scoped, target must be in same branch
      if (req.scope?.branchId && staffProfile.branchId !== req.scope.branchId) {
        sendError(res, 404, 'NOT_FOUND', 'Staff member not found');
        return;
      }

      // Fetch activity logs for this staff member
      const { page, limit } = parsePagination(req.query);
      const { module, startDate, endDate } = req.query as any;

      const activity = await auditLogService.getByActor(
        req.tenantId!,
        staffProfile.user.id,
        { page, limit, module, startDate, endDate },
      );

      sendSuccess(res, {
        profile: staffProfile,
        activity: activity.logs,
        activityMeta: {
          total: activity.total,
          page: activity.page,
          limit: activity.limit,
          totalPages: Math.ceil(activity.total / activity.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
