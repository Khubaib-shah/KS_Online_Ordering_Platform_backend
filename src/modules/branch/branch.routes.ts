// ─── Branch Routes ──────────────────────────────────────────────────
import { Router } from 'express';
import { branchController } from './branch.controller';
import { validate } from '../../middlewares/validate.middleware';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { authRequired } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';

import { createBranchSchema, createDeliveryZoneSchema } from './branch.validation';

const router = Router();

// ── Branches ──
router.get(
  '/branches',
  authRequired,
  tenantResolver(),
  branchController.listBranches
);

router.post(
  '/branches',
  authRequired,
  tenantResolver(),
  requirePermission('settings', 'Create'),
  validate({ body: createBranchSchema }),
  branchController.createBranch
);

router.put(
  '/branches/:id',
  authRequired,
  tenantResolver(),
  requirePermission('settings', 'Edit'),
  validate({ body: createBranchSchema.partial() }),
  branchController.updateBranch
);

router.delete(
  '/branches/:id',
  authRequired,
  tenantResolver(),
  requirePermission('settings', 'Delete'),
  branchController.deleteBranch
);

// ── Delivery Zones ──
router.get(
  '/branches/:branchId/delivery-zones',
  authRequired,
  tenantResolver(),
  branchController.listZones
);

router.post(
  '/branches/:branchId/delivery-zones',
  authRequired,
  tenantResolver(),
  requirePermission('settings', 'Create'),
  validate({ body: createDeliveryZoneSchema }),
  branchController.createZone
);

router.put(
  '/branches/delivery-zones/:id',
  authRequired,
  tenantResolver(),
  requirePermission('settings', 'Edit'),
  validate({ body: createDeliveryZoneSchema.partial() }),
  branchController.updateZone
);

router.delete(
  '/branches/delivery-zones/:id',
  authRequired,
  tenantResolver(),
  requirePermission('settings', 'Delete'),
  branchController.deleteZone
);

// ── Public: Website delivery zones ──
router.get(
  '/website/delivery-zones',
  tenantResolver(),
  branchController.listWebsiteZones
);

export default router;
