// ─── Reports Routes ──────────────────────────────────────────────────
import { Router } from 'express';
import { z } from 'zod';
import { reportController } from './report.controller';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { authRequired } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { validate } from '../../middlewares/validate.middleware';

const reportQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year']).optional().default('today'),
  branchId: z.string().uuid().optional(),
});

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
