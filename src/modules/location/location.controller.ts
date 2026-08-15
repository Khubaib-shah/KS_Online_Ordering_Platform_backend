import { Request, Response } from 'express';
import { LocationService } from './location.service';
import { cacheGetOrSet } from '../../lib/cache';

const locationService = new LocationService();

export class LocationController {
  getTenantCities = async (req: Request, res: Response) => {
    try {
      // req.tenantId is populated by the tenantResolver middleware
      const tenantId = req.tenantId!;

      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID is required' });
      }

      const cacheKey = `tenant:${tenantId}:cities`;
      const cities = await cacheGetOrSet(
        cacheKey,
        () => locationService.getTenantCities(tenantId),
        3600
      );

      res.json({ success: true, data: cities });
    } catch (error: any) {
      console.error('Error fetching tenant cities:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getTenantCityAreas = async (req: Request, res: Response) => {
    try {
      const cityId = req.params.cityId as string;
      const tenantId = req.tenantId!;

      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID is required' });
      }

      const cacheKey = `tenant:${tenantId}:city:${cityId}:areas`;
      const areasGrouped = await cacheGetOrSet(
        cacheKey,
        () => locationService.getTenantCityAreas(tenantId, cityId),
        3600
      );

      res.json({ success: true, data: areasGrouped });
    } catch (error: any) {
      console.error('Error fetching city areas:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // --- Super Admin Handlers ---

  getAllCities = async (req: Request, res: Response) => {
    try {
      const cities = await locationService.getAllCities();
      res.json({ success: true, data: cities });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  createCity = async (req: Request, res: Response) => {
    try {
      const city = await locationService.createCity(req.body);
      res.json({ success: true, data: city });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  updateCity = async (req: Request, res: Response) => {
    try {
      const city = await locationService.updateCity(req.params.id as string, req.body);
      res.json({ success: true, data: city });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  deleteCity = async (req: Request, res: Response) => {
    try {
      await locationService.deleteCity(req.params.id as string);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  restoreCity = async (req: Request, res: Response) => {
    try {
      const city = await locationService.restoreCity(req.params.id as string);
      res.json({ success: true, data: city });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getCityZones = async (req: Request, res: Response) => {
    try {
      const zones = await locationService.getCityZones(req.params.cityId as string);
      res.json({ success: true, data: zones });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  createZone = async (req: Request, res: Response) => {
    try {
      const zone = await locationService.createZone({ ...req.body, cityId: req.params.cityId as string });
      res.json({ success: true, data: zone });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  updateZone = async (req: Request, res: Response) => {
    try {
      const zone = await locationService.updateZone(req.params.id as string, req.body);
      res.json({ success: true, data: zone });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  deleteZone = async (req: Request, res: Response) => {
    try {
      await locationService.deleteZone(req.params.id as string);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  restoreZone = async (req: Request, res: Response) => {
    try {
      const zone = await locationService.restoreZone(req.params.id as string);
      res.json({ success: true, data: zone });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getZoneAreas = async (req: Request, res: Response) => {
    try {
      const areas = await locationService.getZoneAreas(req.params.zoneId as string);
      res.json({ success: true, data: areas });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  createArea = async (req: Request, res: Response) => {
    try {
      const area = await locationService.createArea({ ...req.body, zoneId: req.params.zoneId as string });
      res.json({ success: true, data: area });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  updateArea = async (req: Request, res: Response) => {
    try {
      const area = await locationService.updateArea(req.params.id as string, req.body);
      res.json({ success: true, data: area });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  deleteArea = async (req: Request, res: Response) => {
    try {
      await locationService.deleteArea(req.params.id as string);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  restoreArea = async (req: Request, res: Response) => {
    try {
      const area = await locationService.restoreArea(req.params.id as string);
      res.json({ success: true, data: area });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
