// ─── Super Admin Routes ──────────────────────────────────────────────
import { Router } from 'express';
import { superadminController } from './superadmin.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authRequired, superAdminOnly } from '../../middlewares/auth.middleware';
import { createTenantSchema, updateTenantSchema } from '../tenant/tenant.validation';

import { updateStatusSchema, createGlobalAreaSchema, updateGlobalAreaSchema } from './superadmin.validation';

const router = Router();

// All super admin routes require authentication + super admin role
router.use(authRequired, superAdminOnly);

// List all tenants
router.get('/tenants', superadminController.listTenants);

// Create a new tenant with owner
router.post(
  '/tenants',
  validate({ body: createTenantSchema }),
  superadminController.createTenant
);

// Update tenant status
router.patch(
  '/tenants/:id/status',
  validate({ body: updateStatusSchema }),
  superadminController.updateTenantStatus
);

// Delete tenant permanently
router.delete(
  '/tenants/:id',
  superadminController.deleteTenant
);

// Get tenant detail
router.get('/tenants/:id', superadminController.getTenantDetail);

// Update tenant core info and owner credentials
router.put(
  '/tenants/:id',
  validate({ body: updateTenantSchema }),
  superadminController.updateTenant
);

// Support tickets
router.get('/escalations', superadminController.listSupportEscalations);

// Platform plans
router.get('/plans', superadminController.listPlans);

// Dashboard stats
router.get('/stats', superadminController.getPlatformStats);

// Global Areas
router.get('/areas', superadminController.listGlobalAreas);
router.post(
  '/areas',
  validate({ body: createGlobalAreaSchema }),
  superadminController.createGlobalArea
);
router.put(
  '/areas/:id',
  validate({ body: updateGlobalAreaSchema }),
  superadminController.updateGlobalArea
);
router.delete('/areas/:id', superadminController.deleteGlobalArea);

export default router;
