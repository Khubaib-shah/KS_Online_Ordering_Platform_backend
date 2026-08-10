import { Router } from 'express';
import { LocationController } from './location.controller';
import { authRequired, superAdminOnly } from '../../middlewares/auth.middleware';

const router = Router();
const locationController = new LocationController();

// Public routes for location modal / checkout
router.get('/cities', locationController.getTenantCities);
router.get('/cities/:cityId/areas', locationController.getTenantCityAreas);

// Super Admin routes — protected by auth + role check
router.use('/admin', authRequired, superAdminOnly);
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
