import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { promotionService } from './promotion.service';
import { sendSuccess, sendPaginated } from '../../lib/api-response';
import { parsePagination } from '../../lib/pagination';

export const promotionController = {
  async validatePromo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { promoCode, subtotal } = req.body;
      const result = await promotionService.validate(req.tenantId!, promoCode, subtotal);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async listPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const { promos, total } = await promotionService.list(req.tenantId!, page, limit);
      sendPaginated(res, promos, total, page, limit);
    } catch (error) {
      next(error);
    }
  },

  async createPromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const promo = await promotionService.create(req.tenantId!, req.body);
      sendSuccess(res, promo, 201);
    } catch (error) {
      next(error);
    }
  },

  async updatePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const promo = await promotionService.update(req.params.id, req.body);
      sendSuccess(res, promo);
    } catch (error) {
      next(error);
    }
  },

  async deletePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await promotionService.delete(req.params.id);
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  },
};
