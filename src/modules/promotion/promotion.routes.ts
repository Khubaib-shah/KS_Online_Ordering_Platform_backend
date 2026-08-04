// ─── Promotion Routes ───────────────────────────────────────────────
import { Router } from 'express';
import { promotionController } from './promotion.controller';
import { validate } from '../../middlewares/validate.middleware';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { authRequired } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';

import { createPromoSchema, validatePromoSchema } from './promotion.validation';

const router = Router();

// ── Public: Validate promo code ──
router.post(
  '/website/promos/validate',
  tenantResolver(),
  validate({ body: validatePromoSchema }),
  promotionController.validatePromo
);

// ── Admin: CRUD ──
router.get(
  '/promotions',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'READ'),
  promotionController.listPromotions
);

router.post(
  '/promotions',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'MANAGE'),
  validate({ body: createPromoSchema }),
  promotionController.createPromotion
);

router.put(
  '/promotions/:id',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'MANAGE'),
  validate({ body: createPromoSchema.partial() }),
  promotionController.updatePromotion
);

router.delete(
  '/promotions/:id',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'MANAGE'),
  promotionController.deletePromotion
);

export default router;
