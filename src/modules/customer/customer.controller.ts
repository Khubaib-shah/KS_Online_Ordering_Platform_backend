// ─── Customer Controller ────────────────────────────────────────────

import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { customerService } from './customer.service';
import { sendSuccess, sendPaginated } from '../../lib/api-response';
import { parsePagination } from '../../lib/pagination';

export const customerController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const { search, tier } = req.query;
      const { customers, total } = await customerService.list(req.tenantId!, { search, tier }, page, limit);
      sendPaginated(res, customers, total, page, limit);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.getById(req.params.id);
      sendSuccess(res, customer);
    } catch (error) {
      next(error);
    }
  },
};
