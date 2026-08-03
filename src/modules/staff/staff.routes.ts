// ─── Staff/Team Routes ──────────────────────────────────────────────
import { Router } from 'express';
import { z } from 'zod';
import { staffController } from './staff.controller';
import { validate } from '../../middlewares/validate.middleware';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { authRequired } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { staffInviteRateLimiter } from '../../middlewares/rate-limit.middleware';

const inviteStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  designation: z.enum(['OWNER', 'BRANCH_MANAGER', 'CASHIER', 'KITCHEN_STAFF', 'RIDER', 'GENERAL_STAFF']),
  branchId: z.string().uuid().optional(),
  password: z.string().min(8),
  permissionOrders: z.enum(['NONE', 'READ', 'MANAGE']).optional(),
  permissionMenu: z.enum(['NONE', 'READ', 'MANAGE']).optional(),
  permissionReports: z.enum(['NONE', 'READ', 'MANAGE']).optional(),
  permissionSettings: z.enum(['NONE', 'READ', 'MANAGE']).optional(),
});

const updatePermissionsSchema = z.object({
  designation: z.enum(['OWNER', 'BRANCH_MANAGER', 'CASHIER', 'KITCHEN_STAFF', 'RIDER', 'GENERAL_STAFF']).optional(),
  branchId: z.string().uuid().optional().nullable(),
  permissionOrders: z.enum(['NONE', 'READ', 'MANAGE']).optional(),
  permissionMenu: z.enum(['NONE', 'READ', 'MANAGE']).optional(),
  permissionReports: z.enum(['NONE', 'READ', 'MANAGE']).optional(),
  permissionSettings: z.enum(['NONE', 'READ', 'MANAGE']).optional(),
});

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
