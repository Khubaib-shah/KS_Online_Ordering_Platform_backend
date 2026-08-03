import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { staffService } from './staff.service';
import { sendSuccess, sendPaginated } from '../../lib/api-response';
import { parsePagination } from '../../lib/pagination';

export const staffController = {
  async listStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const { staff, total } = await staffService.list(req.tenantId!, page, limit);
      sendPaginated(res, staff, total, page, limit);
    } catch (error) {
      next(error);
    }
  },

  async inviteStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await staffService.invite(req.tenantId!, req.body);
      sendSuccess(res, user, 201);
    } catch (error) {
      next(error);
    }
  },

  async updatePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await staffService.updatePermissions(req.params.id, req.body);
      sendSuccess(res, staff);
    } catch (error) {
      next(error);
    }
  },

  async deactivateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await staffService.deactivate(req.params.userId);
      sendSuccess(res, { deactivated: true });
    } catch (error) {
      next(error);
    }
  },
};
