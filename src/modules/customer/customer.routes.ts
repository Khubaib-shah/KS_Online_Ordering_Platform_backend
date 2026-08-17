// ─── Customer Routes ────────────────────────────────────────────────

import { Router } from 'express';
import { customerController } from './customer.controller';
import { validate } from '../../middlewares/validate.middleware';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { authRequired } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { listCustomersQuerySchema } from './customer.validation';

const router = Router();

router.get(
  '/',
  authRequired,
  tenantResolver(),
  requirePermission('customers', 'View'),
  validate({ query: listCustomersQuerySchema }),
  customerController.list
);

router.get(
  '/:id',
  authRequired,
  tenantResolver(),
  requirePermission('customers', 'View'),
  customerController.getById
);

export default router;
