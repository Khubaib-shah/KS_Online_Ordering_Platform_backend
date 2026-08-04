import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { authRequired } from '../../middlewares/auth.middleware';

const router = Router();

router.get(
  '/dashboard',
  authRequired,
  tenantResolver(),
  analyticsController.getDashboardStats
);

export default router;
