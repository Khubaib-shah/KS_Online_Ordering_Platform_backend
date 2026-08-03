// ─── Promotion Routes ───────────────────────────────────────────────
import { Router } from 'express';
import { z } from 'zod';
import { promotionController } from './promotion.controller';
import { validate } from '../../middlewares/validate.middleware';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { authRequired } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';

const createPromoSchema = z.object({
  code: z.string().min(1).max(50).transform(v => v.toUpperCase()),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_DELIVERY']),
  discountValue: z.number().min(0),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountCap: z.number().min(0).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
});

const validatePromoSchema = z.object({
  promoCode: z.string().min(1),
  subtotal: z.number().min(0),
});

const router = Router();

// ── Public: Validate promo code ──
router.post(
  '/storefront/promos/validate',
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
