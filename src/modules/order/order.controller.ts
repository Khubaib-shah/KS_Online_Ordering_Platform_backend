// ─── Order Controller ───────────────────────────────────────────────

import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { orderService } from './order.service';
import { sendSuccess, sendPaginated, sendError } from '../../lib/api-response';
import { prisma } from '../../config/database';
import { parsePagination } from '../../lib/pagination';
import { enforceBranchScope } from '../../middlewares/scope-resolver.middleware';

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
      // Enforce branch scope on POS order creation
      const enforcedBranch = enforceBranchScope(req, res, req.body.branchId);
      if (enforcedBranch === '__BLOCKED__') return;
      if (enforcedBranch) req.body.branchId = enforcedBranch;

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

      // Enforce branch scope
      const enforcedBranch = enforceBranchScope(req, res, branchId);
      if (enforcedBranch === '__BLOCKED__') return;

      const { orders, total, statusCounts } = await orderService.listOrders(
        req.tenantId!,
        { branchId: enforcedBranch, status, channel, search, startDate, endDate },
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
      // If branch-scoped, verify the order belongs to the actor's branch
      if (req.scope?.branchId && order && (order as any).branch?.id !== req.scope.branchId) {
        sendError(res, 404, 'NOT_FOUND', 'Order not found');
        return;
      }
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  },

  async deleteOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Verify branch scope before deleting
      const order = await orderService.getOrderById(req.params.id, req.tenantId!);
      if (req.scope?.branchId && order && (order as any).branch?.id !== req.scope.branchId) {
        sendError(res, 404, 'NOT_FOUND', 'Order not found');
        return;
      }
      await orderService.deleteOrder(req.params.id, req.tenantId!, req.user?.userId);
      sendSuccess(res, { message: 'Order deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, notes } = req.body;
      // Verify branch scope
      const order = await orderService.getOrderById(req.params.id, req.tenantId!);
      if (req.scope?.branchId && order && (order as any).branch?.id !== req.scope.branchId) {
        sendError(res, 404, 'NOT_FOUND', 'Order not found');
        return;
      }
      let author = 'System';
      if (req.user?.userId) {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { name: true }});
        if (user) author = user.name;
      }
      const updated = await orderService.updateStatus(req.params.id, req.tenantId!, status, notes, author, req.user?.userId);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  },

  async updatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { paymentStatus, paymentMethod } = req.body;
      // Verify branch scope
      const order = await orderService.getOrderById(req.params.id, req.tenantId!);
      if (req.scope?.branchId && order && (order as any).branch?.id !== req.scope.branchId) {
        sendError(res, 404, 'NOT_FOUND', 'Order not found');
        return;
      }
      const updated = await orderService.updatePaymentStatus(req.params.id, req.tenantId!, {
        paymentStatus,
        paymentMethod,
      });
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  },

  async getKitchenOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { branchId } = req.query as { branchId?: string };
      // Enforce branch scope
      const enforcedBranch = enforceBranchScope(req, res, branchId);
      if (enforcedBranch === '__BLOCKED__') return;

      const orders = await orderService.getKitchenOrders(req.tenantId!, enforcedBranch);
      sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  },
};
