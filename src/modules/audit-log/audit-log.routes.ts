// ─── Audit Log Routes ───────────────────────────────────────────────
import { Router } from 'express';
import { authRequired } from '../../middlewares/auth.middleware';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { resolveScope } from '../../middlewares/scope-resolver.middleware';
import { auditLogController } from './audit-log.controller';

const router = Router();

router.get(
  '/',
  authRequired,
  tenantResolver(),
  requirePermission('settings', 'View'),
  resolveScope(),
  auditLogController.getAuditLogs
);

export default router;
