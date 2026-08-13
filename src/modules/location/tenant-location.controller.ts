import { Request, Response, NextFunction } from 'express';
import { tenantLocationService } from './tenant-location.service';
import { sendSuccess } from '../../lib/api-response';

export class TenantLocationController {
  // Super Admin: Assign Location
  async assignLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = req.params;
      const { locationType, cityId, zoneId, areaId } = req.body;
      const result = await tenantLocationService.assignLocationToTenant(tenantId as string, locationType, cityId, zoneId, areaId);
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
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
