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
      const orderData = { ...req.body, createdById: req.user?.userId };
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
      
      let createdById: string | undefined;

      if (req.user && req.user.globalRole !== 'SUPER_ADMIN') {
        const staffProfile = await prisma.staffProfile.findUnique({
          where: { userId: req.user.userId },
          include: { role: true },
        });

        if (staffProfile && !staffProfile.isOwner && staffProfile.role?.permissions) {
          const perms = staffProfile.role.permissions as any;
          const ordersPerm = (perms.orders || perms.Orders || '').toString().toLowerCase();
          if (ordersPerm === 'self_only') {
            createdById = req.user.userId;
          }
        }
      }

      const { orders, total, statusCounts } = await orderService.listOrders(
        req.tenantId!,
        { branchId, status, channel, search, startDate, endDate, createdById },
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
      const order = await orderService.updateStatus(req.params.id, req.tenantId!, status, notes);
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
