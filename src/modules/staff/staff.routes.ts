// ─── Staff/Team Routes ──────────────────────────────────────────────
import { Router } from 'express';
import { staffController } from './staff.controller';
import { validate } from '../../middlewares/validate.middleware';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { authRequired } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { staffInviteRateLimiter } from '../../middlewares/rate-limit.middleware';

import { inviteStaffSchema, updatePermissionsSchema } from './staff.validation';

const router = Router();

// List team members
router.get(
  '/',
  authRequired,
  tenantResolver(),
  requirePermission('settings', 'READ'),
  staffController.listStaff
);

// Invite new staff
router.post(
  '/invite',
  staffInviteRateLimiter,
  authRequired,
  tenantResolver(),
  requirePermission('settings', 'MANAGE'),
  validate({ body: inviteStaffSchema }),
  staffController.inviteStaff
);

// Update staff permissions
router.put(
  '/:id/permissions',
  authRequired,
  tenantResolver(),
  requirePermission('settings', 'MANAGE'),
  validate({ body: updatePermissionsSchema }),
  staffController.updatePermissions
);

// Deactivate staff
router.patch(
  '/:userId/deactivate',
  authRequired,
  tenantResolver(),
  requirePermission('settings', 'MANAGE'),
  staffController.deactivateStaff
);

export default router;
//
