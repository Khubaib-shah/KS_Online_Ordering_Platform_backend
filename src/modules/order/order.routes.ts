// ─── Order Routes ───────────────────────────────────────────────────

import { Router } from 'express';
import { orderController } from './order.controller';
import { validate } from '../../middlewares/validate.middleware';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { authRequired } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { orderCreationRateLimiter } from '../../middlewares/rate-limit.middleware';
import {
  createWebsiteOrderSchema,
  createPosOrderSchema,
  updateOrderStatusSchema,
  listOrdersQuerySchema,
  guestOrderTrackingSchema,
} from './order.validation';

const router = Router();

// ── Website (public, guest-safe) ──
router.post(
  '/website/orders',
  orderCreationRateLimiter,
  tenantResolver(),
  validate({ body: createWebsiteOrderSchema }),
  orderController.createWebsiteOrder
);

router.get(
  '/website/orders/:orderNumber',
  tenantResolver(),
  validate({ query: guestOrderTrackingSchema }),
  orderController.trackGuestOrder
);

// ── POS (authenticated staff) ──
router.post(
  '/pos/orders',
  authRequired,
  tenantResolver(),
  requirePermission('orders', 'MANAGE'),
  validate({ body: createPosOrderSchema }),
  orderController.createPosOrder
);

// ── Admin Order Management ──
router.get(
  '/orders',
  authRequired,
  tenantResolver(),
  requirePermission('orders', 'READ'),
  validate({ query: listOrdersQuerySchema }),
  orderController.listOrders
);

router.get(
  '/orders/kitchen',
  authRequired,
  tenantResolver(),
  requirePermission('orders', 'READ'),
  orderController.getKitchenOrders
);

router.get(
  '/orders/:id',
  authRequired,
  tenantResolver(),
  requirePermission('orders', 'READ'),
  orderController.getOrder
);

router.patch(
  '/orders/:id/status',
  authRequired,
  tenantResolver(),
  requirePermission('orders', 'MANAGE'),
  validate({ body: updateOrderStatusSchema }),
  orderController.updateStatus
);

export default router;
