import { Router } from 'express';
import { LocationController } from './location.controller';
import { TenantLocationController } from './tenant-location.controller';
import { authRequired, superAdminOnly } from '../../middlewares/auth.middleware';

const router = Router();
const locationController = new LocationController();
const tenantLocationController = new TenantLocationController();

// Public routes for location modal / checkout
router.get('/cities', locationController.getTenantCities);
router.get('/cities/:cityId/areas', locationController.getTenantCityAreas);

// Tenant Admin routes - protected by auth (TenantResolver handles req.tenantId)
router.get('/effective-access', authRequired, tenantLocationController.getEffectiveAccess);
router.patch('/overrides/:locationType/:locationId', authRequired, tenantLocationController.updateOverride);

// Super Admin routes — protected by auth + role check
router.use('/admin', authRequired, superAdminOnly);
router.post('/admin/tenants/:tenantId/locations', tenantLocationController.assignLocation);
router.delete('/admin/tenants/:tenantId/locations/:locationType/:locationId', tenantLocationController.unassignLocation);

router.get('/admin/cities', locationController.getAllCities);
router.post('/admin/cities', locationController.createCity);
router.put('/admin/cities/:id', locationController.updateCity);
router.delete('/admin/cities/:id', locationController.deleteCity);
router.post('/admin/cities/:id/restore', locationController.restoreCity);

router.get('/admin/cities/:cityId/zones', locationController.getCityZones);
router.post('/admin/cities/:cityId/zones', locationController.createZone);
router.put('/admin/zones/:id', locationController.updateZone);
router.delete('/admin/zones/:id', locationController.deleteZone);
router.post('/admin/zones/:id/restore', locationController.restoreZone);

router.get('/admin/zones/:zoneId/areas', locationController.getZoneAreas);
router.post('/admin/zones/:zoneId/areas', locationController.createArea);
router.put('/admin/areas/:id', locationController.updateArea);
router.delete('/admin/areas/:id', locationController.deleteArea);
router.post('/admin/areas/:id/restore', locationController.restoreArea);

export const locationRoutes = router;
