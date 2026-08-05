// ─── Menu Controller ────────────────────────────────────────────────

import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { menuService } from './menu.service';
import { sendSuccess, sendPaginated } from '../../lib/api-response';
import { parsePagination } from '../../lib/pagination';

export const menuController = {
  // ── Public ──
  async getPublicCatalog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const catalog = await menuService.getPublicCatalog(tenantId);
      sendSuccess(res, catalog);
    } catch (error) {
      next(error);
    }
  },

  // ── Categories (admin) ──
  async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await menuService.listAllCategories(req.tenantId!);
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await menuService.createCategory(req.tenantId!, req.body);
      sendSuccess(res, category, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await menuService.updateCategory(req.params.id, req.tenantId!, req.body);
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  },

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await menuService.deleteCategory(req.params.id, req.tenantId!);
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  },

  // ── Menu Items (admin) ──
  async listMenuItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const { categoryId, isAvailable, isFeatured, search } = req.query;
      const { items, total } = await menuService.listMenuItems(
        req.tenantId!,
        { categoryId, isAvailable, isFeatured, search },
        page,
        limit
      );
      sendPaginated(res, items, total, page, limit);
    } catch (error) {
      next(error);
    }
  },

  async getMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await menuService.getMenuItemById(req.params.id);
      sendSuccess(res, item);
    } catch (error) {
      next(error);
    }
  },

  async createMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await menuService.createMenuItem(req.tenantId!, req.body);
      sendSuccess(res, item, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await menuService.updateMenuItem(req.params.id, req.tenantId!, req.body);
      sendSuccess(res, item);
    } catch (error) {
      next(error);
    }
  },

  async deleteMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await menuService.deleteMenuItem(req.params.id, req.tenantId!);
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  },

  async toggleAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isAvailable } = req.body;
      const result = await menuService.toggleAvailability(req.params.id, req.tenantId!, isAvailable);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async toggleOnlineAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { availableOnline } = req.body;
      const result = await menuService.toggleOnlineAvailability(req.params.id, req.tenantId!, availableOnline);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
};
