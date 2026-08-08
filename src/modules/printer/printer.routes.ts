// ─── Printer Routes ─────────────────────────────────────────────────
import { Router } from 'express';
import { printerController } from './printer.controller';
import { authRequired } from '../../middlewares/auth.middleware';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';

const router = Router();

// Pair a printer device using a 4-digit code
router.post(
  '/pair',
  authRequired,
  tenantResolver(),
  requirePermission('settings', 'Create'),
  printerController.pairDevice
);

// List pending (unpaired) devices — admin/debug endpoint
router.get(
  '/pending',
  authRequired,
  tenantResolver(),
  requirePermission('settings', 'Edit'),
  printerController.listPendingDevices
);

export default router;
