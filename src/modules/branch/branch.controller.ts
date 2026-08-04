import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { branchService } from './branch.service';
import { sendSuccess } from '../../lib/api-response';

export const branchController = {
  async listBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branches = await branchService.list(req.tenantId!);
      sendSuccess(res, branches);
    } catch (error) {
      next(error);
    }
  },

  async createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branch = await branchService.create(req.tenantId!, req.body);
      sendSuccess(res, branch, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branch = await branchService.update(req.params.id, req.body);
      sendSuccess(res, branch);
    } catch (error) {
      next(error);
    }
  },

  async deleteBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await branchService.delete(req.params.id);
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  },

  async listZones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const zones = await branchService.listZones(req.params.branchId);
      sendSuccess(res, zones);
    } catch (error) {
      next(error);
    }
  },

  async createZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const zone = await branchService.createZone(req.params.branchId, req.body);
      sendSuccess(res, zone, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const zone = await branchService.updateZone(req.params.id, req.body);
      sendSuccess(res, zone);
    } catch (error) {
      next(error);
    }
  },

  async deleteZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await branchService.deleteZone(req.params.id);
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  },

  async listWebsiteZones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const zones = await branchService.listWebsiteZones(req.tenantId!);
      sendSuccess(res, zones);
    } catch (error) {
      next(error);
    }
  },
};
