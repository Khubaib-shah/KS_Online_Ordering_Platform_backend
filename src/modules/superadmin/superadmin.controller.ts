import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { superadminService } from './superadmin.service';
import { sendSuccess, sendPaginated } from '../../lib/api-response';
import { parsePagination } from '../../lib/pagination';

export const superadminController = {
  async listTenants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const { tenants, total } = await superadminService.listTenants(page, limit);
      sendPaginated(res, tenants, total, page, limit);
    } catch (error) {
      next(error);
    }
  },

  async createTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await superadminService.createTenant(req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateTenantStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await superadminService.updateTenantStatus(req.params.id, req.body.status);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async deleteTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await superadminService.deleteTenant(req.params.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async updateTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await superadminService.updateTenant(req.params.id, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getTenantDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenant = await superadminService.getTenantDetail(req.params.id);
      sendSuccess(res, tenant);
    } catch (error) {
      next(error);
    }
  },

  async listSupportEscalations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const { tickets, total } = await superadminService.listSupportEscalations(page, limit);
      sendPaginated(res, tickets, total, page, limit);
    } catch (error) {
      next(error);
    }
  },

  async listPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await superadminService.listPlans();
      sendSuccess(res, plans);
    } catch (error) {
      next(error);
    }
  },

  async getPlatformStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await superadminService.getPlatformStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  },

  async listGlobalAreas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const areas = await superadminService.listGlobalAreas();
      sendSuccess(res, areas);
    } catch (error) {
      next(error);
    }
  },

  async createGlobalArea(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const area = await superadminService.createGlobalArea(req.body);
      sendSuccess(res, area, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateGlobalArea(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const area = await superadminService.updateGlobalArea(req.params.id, req.body);
      sendSuccess(res, area);
    } catch (error) {
      next(error);
    }
  },

  async deleteGlobalArea(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await superadminService.deleteGlobalArea(req.params.id);
      sendSuccess(res, { message: 'Area deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
