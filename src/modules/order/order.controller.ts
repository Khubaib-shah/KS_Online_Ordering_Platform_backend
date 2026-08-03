// ─── Order Controller ───────────────────────────────────────────────

import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { orderService } from './order.service';
import { sendSuccess, sendPaginated } from '../../lib/api-response';
import { parsePagination } from '../../lib/pagination';

export const orderController = {
  // ── Storefront ──
  async createStorefrontOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await orderService.createStorefrontOrder(req.tenantId!, req.body);
      sendSuccess(res, order, 201);
    } catch (error) {
      next(error);
    }
  },

  async trackGuestOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderNumber } = req.params;
      const { phone } = req.query as { phone: string };
      const order = await orderService.getOrderByNumber(orderNumber, phone);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  },

  // ── POS ──
  async createPosOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await orderService.createPosOrder(req.tenantId!, req.body);
      sendSuccess(res, order, 201);
    } catch (error) {
      next(error);
    }
  },

  // ── Admin ──
  async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const { branchId, status, channel, search } = req.query;
      const { orders, total } = await orderService.listOrders(
        req.tenantId!,
        { branchId, status, channel, search },
        page,
        limit
      );
      sendPaginated(res, orders, total, page, limit);
    } catch (error) {
      next(error);
    }
  },

  async getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await orderService.getOrderById(req.params.id);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, notes } = req.body;
      const order = await orderService.updateStatus(req.params.id, status, notes);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  },

  async getKitchenOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId } = req.query as { branchId?: string };
      const orders = await orderService.getKitchenOrders(req.tenantId!, branchId);
      sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  },
};
