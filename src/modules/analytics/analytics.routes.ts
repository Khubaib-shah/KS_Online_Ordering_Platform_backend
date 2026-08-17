import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { authRequired } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { resolveScope } from '../../middlewares/scope-resolver.middleware';

const router = Router();

router.get(
  '/dashboard',
  authRequired,
  tenantResolver(),
  requirePermission('reports', 'View'),
  resolveScope(),
  analyticsController.getDashboardStats
);

export default router;
