// ─── Staff/Team Routes ──────────────────────────────────────────────
import { Router } from "express";
import { staffController } from "./staff.controller";
import { validate } from "../../middlewares/validate.middleware";
import { tenantResolver } from "../../middlewares/tenant-resolver.middleware";
import { authRequired } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../middlewares/permission.middleware";
import { resolveScope } from "../../middlewares/scope-resolver.middleware";
import { staffInviteRateLimiter } from "../../middlewares/rate-limit.middleware";
import { requireCsrf } from "../auth/auth.controller";

import { inviteStaffSchema, updatePermissionsSchema } from "./staff.validation";

const router = Router();

// List team members
router.get(
  "/",
  authRequired,
  tenantResolver(),
  requirePermission("staff", "View"),
  staffController.listStaff,
);

// Staff detail + activity
router.get(
  "/:id/activity",
  authRequired,
  tenantResolver(),
  requirePermission("staff", "View"),
  resolveScope(),
  staffController.getStaffActivity,
);

// Invite new staff
router.post(
  "/invite",
  staffInviteRateLimiter,
  authRequired,
  tenantResolver(),
  requirePermission("staff", "Create"),
  requireCsrf,
  validate({ body: inviteStaffSchema }),
  staffController.inviteStaff,
);

// Update staff permissions
router.put(
  "/:id/permissions",
  authRequired,
  tenantResolver(),
  requirePermission("staff", "Edit"),
  requireCsrf,
  validate({ body: updatePermissionsSchema }),
  staffController.updatePermissions,
);

// Deactivate staff
router.patch(
  "/:userId/deactivate",
  authRequired,
  tenantResolver(),
  requirePermission("staff", "Edit"),
  requireCsrf,
  staffController.deactivateStaff,
);

export default router;
