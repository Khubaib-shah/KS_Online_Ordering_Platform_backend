// ─── Tenant Routes ──────────────────────────────────────────────────
// Path + middleware wiring only.

import { Router } from 'express';
import { tenantController } from './tenant.controller';
import { validate } from '../../middlewares/validate.middleware';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { authRequired, superAdminOnly } from '../../middlewares/auth.middleware';
import {
  resolveTenantQuerySchema,
  updateTenantSettingsSchema,
  updateTenantThemeSchema,
  updateTenantContentSchema,
} from './tenant.validation';

const router = Router();

// ── Public ──
router.get(
  '/resolve',
  validate({ query: resolveTenantQuerySchema }),
  tenantController.resolve
);

// ── Tenant-scoped (authenticated staff) ──
router.get(
  '/current',
  authRequired,
  tenantResolver(),
  tenantController.getCurrent
);

router.get(
  '/areas',
  authRequired,
  tenantController.listGlobalAreas
);

// ── Tenant-scoped (authenticated staff) ──
router.put(
  '/settings',
  authRequired,
  tenantResolver(),
  validate({ body: updateTenantSettingsSchema }),
  tenantController.updateSettings
);

router.put(
  '/theme',
  authRequired,
  tenantResolver(),
  validate({ body: updateTenantThemeSchema }),
  tenantController.updateTheme
);

router.put(
  '/content',
  authRequired,
  tenantResolver(),
  validate({ body: updateTenantContentSchema }),
  tenantController.updateContent
);

// ── Super Admin ──
router.get(
  '/all',
  authRequired,
  superAdminOnly,
  tenantController.listAll
);

router.patch(
  '/:id/status',
  authRequired,
  superAdminOnly,
  tenantController.updateStatus
);

export default router;
