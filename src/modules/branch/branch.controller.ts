import { Request as ExpressRequest, Response, NextFunction } from 'express';
type Request = ExpressRequest<any>;
import { branchService } from './branch.service';
import { sendSuccess } from '../../lib/api-response';
import { getRedisClient } from '../../config/redis';

const invalidateLocationCache = async (tenantId: string) => {
  try {
    const redisClient = await getRedisClient();
    const keys = await redisClient.keys(`tenant:${tenantId}:city:*:areas`);
    keys.push(`tenant:${tenantId}:cities`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    console.error('Failed to invalidate location cache', err);
  }
};

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
      const branch = await branchService.update(req.params.id, req.tenantId!, req.body);
      sendSuccess(res, branch);
    } catch (error) {
      next(error);
    }
  },

  async deleteBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await branchService.delete(req.params.id, req.tenantId!);
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
      if (req.tenantId) await invalidateLocationCache(req.tenantId);
      sendSuccess(res, zone, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const zone = await branchService.updateZone(req.params.id, req.tenantId!, req.body);
      if (req.tenantId) await invalidateLocationCache(req.tenantId);
      sendSuccess(res, zone);
    } catch (error) {
      next(error);
    }
  },

  async deleteZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await branchService.deleteZone(req.params.id, req.tenantId!);
      if (req.tenantId) await invalidateLocationCache(req.tenantId);
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
