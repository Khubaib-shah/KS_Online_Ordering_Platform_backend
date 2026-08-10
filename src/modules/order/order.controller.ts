// ─── Order Controller ───────────────────────────────────────────────

import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { orderService } from './order.service';
import { sendSuccess, sendPaginated } from '../../lib/api-response';
import { prisma } from '../../config/database';
import { parsePagination } from '../../lib/pagination';

export const orderController = {
  // ── Website ──
  async createWebsiteOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await orderService.createWebsiteOrder(req.tenantId!, req.body);
      sendSuccess(res, order, 201);
    } catch (error) {
      next(error);
    }
  },

  async trackGuestOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderNumber } = req.params;
      const { phone } = req.query as { phone: string };
      const order = await orderService.getOrderByNumber(orderNumber, phone, req.tenantId!);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  },

  // ── POS ──
  async createPosOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user?.userId }, select: { name: true }});
      const orderData = { ...req.body, createdById: req.user?.userId, author: user?.name || 'Staff' };
      const order = await orderService.createPosOrder(req.tenantId!, orderData);
      sendSuccess(res, order, 201);
    } catch (error) {
      next(error);
    }
  },

  // ── Admin ──
  async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const { branchId, status, channel, search, startDate, endDate } = req.query as any;

      const { orders, total, statusCounts } = await orderService.listOrders(
        req.tenantId!,
        { branchId, status, channel, search, startDate, endDate },
        page,
        limit
      );
      sendPaginated(res, orders, total, page, limit, { statusCounts });
    } catch (error) {
      next(error);
    }
  },

  async getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await orderService.getOrderById(req.params.id, req.tenantId!);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  },

  async deleteOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await orderService.deleteOrder(req.params.id, req.tenantId!);
      sendSuccess(res, { message: 'Order deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, notes } = req.body;
      let author = 'System';
      if (req.user?.userId) {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { name: true }});
        if (user) author = user.name;
      }
      const order = await orderService.updateStatus(req.params.id, req.tenantId!, status, notes, author);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  },

  async updatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { paymentStatus, paymentMethod } = req.body;
      const order = await orderService.updatePaymentStatus(req.params.id, req.tenantId!, {
        paymentStatus,
        paymentMethod,
      });
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
