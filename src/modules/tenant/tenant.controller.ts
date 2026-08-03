// ─── Tenant Controller ──────────────────────────────────────────────
// Parses request, calls service, shapes response — no business logic.

import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { tenantService } from './tenant.service';
import { sendSuccess, sendPaginated } from '../../lib/api-response';
import { parsePagination } from '../../lib/pagination';
import { superadminService } from '../superadmin/superadmin.service';

export const tenantController = {
  async resolve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug, domain } = req.query as { slug?: string; domain?: string };
      const tenant = await tenantService.resolve(slug, domain);
      sendSuccess(res, tenant);
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

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenant = await tenantService.getById(req.params.id);
      sendSuccess(res, tenant);
    } catch (error) {
      next(error);
    }
  },

  async getCurrent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenant = await tenantService.getById(req.tenantId!);
      sendSuccess(res, tenant);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tenantService.createWithOwner(req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const result = await tenantService.updateSettings(tenantId, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async updateTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const result = await tenantService.updateTheme(tenantId, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async updateContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const result = await tenantService.updateContent(tenantId, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const { tenants, total } = await tenantService.listAll(page, limit);
      sendPaginated(res, tenants, total, page, limit);
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const result = await tenantService.updateStatus(req.params.id, status);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
};
