import { Request, Response, NextFunction } from 'express';
import { tenantLocationService } from './tenant-location.service';
import { sendSuccess } from '../../lib/api-response';
import { getRedisClient } from '../../config/redis';

export class TenantLocationController {
  // Helper to clear cache
  private async clearTenantLocationCache(tenantId: string) {
    try {
      const redisClient = await getRedisClient();
      // Use scan or keys to find and delete all city/area cache keys for this tenant
      // For simplicity, we can just delete the known specific keys if possible, or use a wildcard approach.
      // Easiest is to delete `tenant:${tenantId}:cities`. Area caches will also need invalidation, which might be `tenant:${tenantId}:city:*:areas`
      const keys = await redisClient.keys(`tenant:${tenantId}:cit*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error('Failed to clear redis cache for tenant locations:', error);
    }
  }

  // Super Admin: Assign Location
  async assignLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = req.params;
      const { locationType, cityId, zoneId, areaId } = req.body;
      const result = await tenantLocationService.assignLocationToTenant(tenantId as string, locationType, cityId, zoneId, areaId);
      
      // Clear cache
      const controller = new TenantLocationController();
      await controller.clearTenantLocationCache(tenantId as string);

      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  // Super Admin: Unassign Location
  async unassignLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId, locationType, locationId } = req.params;
      await tenantLocationService.unassignLocationFromTenant(tenantId as string, locationType as any, locationId as string);
      
      // Clear cache
      const controller = new TenantLocationController();
      await controller.clearTenantLocationCache(tenantId as string);

      sendSuccess(res, { message: 'Location unassigned successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Super Admin: List Tenant Locations
  async listTenantLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = req.params;
      const locations = await tenantLocationService.listTenantLocations(tenantId as string);
      sendSuccess(res, locations);
    } catch (error) {
      next(error);
    }
  }

  // Tenant Admin: Get Effective Access
  async getEffectiveAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const access = await tenantLocationService.getTenantEffectiveLocationAccess(tenantId);
      sendSuccess(res, access);
    } catch (error) {
      next(error);
    }
  }

  // Tenant Admin: Update Override
  async updateOverride(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { locationType, locationId } = req.params;
      const { isEnabled } = req.body;
      const result = await tenantLocationService.updateTenantLocationStatus(tenantId, locationType as any, locationId as string, isEnabled);
      
      // Clear cache
      const controller = new TenantLocationController();
      await controller.clearTenantLocationCache(tenantId as string);

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
