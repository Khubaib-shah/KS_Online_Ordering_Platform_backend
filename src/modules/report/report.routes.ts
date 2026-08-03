// ─── Reports Routes ──────────────────────────────────────────────────
import { Router } from 'express';
import { reportController } from './report.controller';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { authRequired } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { validate } from '../../middlewares/validate.middleware';

import { reportQuerySchema } from './report.validation';

const router = Router();

router.get(
  '/summary',
  authRequired,
  tenantResolver(),
  requirePermission('reports', 'READ'),
  validate({ query: reportQuerySchema }),
  reportController.getSummary
);

export default router;
