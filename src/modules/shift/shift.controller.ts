import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { shiftService } from './shift.service';
import { sendSuccess } from '../../lib/api-response';
import { enforceBranchScope } from '../../middlewares/scope-resolver.middleware';

export const shiftController = {
  async getMyActiveShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shift = await shiftService.getMyActiveShift(req.tenantId!, req.user!.userId);
      sendSuccess(res, shift);
    } catch (error) {
      next(error);
    }
  },

  async getMyPreviousShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shift = await shiftService.getMyPreviousShift(req.tenantId!, req.user!.userId);
      sendSuccess(res, shift);
    } catch (error) {
      next(error);
    }
  },

  async getBranchShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId } = req.query as { branchId: string };
      const enforcedBranch = enforceBranchScope(req, res, branchId);
      if (enforcedBranch === '__BLOCKED__') return;
      if (!enforcedBranch) throw new Error('branchId is required');
      const shifts = await shiftService.getBranchShifts(req.tenantId!, enforcedBranch);
      sendSuccess(res, shifts);
    } catch (error) {
      next(error);
    }
  },

  async getBranchShiftHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId, limit } = req.query as { branchId: string; limit?: string };
      const enforcedBranch = enforceBranchScope(req, res, branchId);
      if (enforcedBranch === '__BLOCKED__') return;
      if (!enforcedBranch) throw new Error('branchId is required');
      const shifts = await shiftService.getBranchShiftHistory(req.tenantId!, enforcedBranch, limit ? parseInt(limit, 10) : 10);
      sendSuccess(res, shifts);
    } catch (error) {
      next(error);
    }
  }
};
