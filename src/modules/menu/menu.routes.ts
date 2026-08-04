// ─── Menu Routes ────────────────────────────────────────────────────

import { Router } from 'express';
import { menuController } from './menu.controller';
import { validate } from '../../middlewares/validate.middleware';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { authRequired } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  listMenuItemsQuerySchema,
} from './menu.validation';

const router = Router();

// ── Public Website Catalog ──
router.get(
  '/website/catalog',
  tenantResolver(),
  menuController.getPublicCatalog
);

// ── Admin: Categories ──
router.get(
  '/menu/categories',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'READ'),
  menuController.listCategories
);

router.post(
  '/menu/categories',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'MANAGE'),
  validate({ body: createCategorySchema }),
  menuController.createCategory
);

router.put(
  '/menu/categories/:id',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'MANAGE'),
  validate({ body: updateCategorySchema }),
  menuController.updateCategory
);

router.delete(
  '/menu/categories/:id',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'MANAGE'),
  menuController.deleteCategory
);

// ── Admin: Menu Items ──
router.get(
  '/menu/items',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'READ'),
  validate({ query: listMenuItemsQuerySchema }),
  menuController.listMenuItems
);

router.get(
  '/menu/items/:id',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'READ'),
  menuController.getMenuItem
);

router.post(
  '/menu/items',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'MANAGE'),
  validate({ body: createMenuItemSchema }),
  menuController.createMenuItem
);

router.put(
  '/menu/items/:id',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'MANAGE'),
  validate({ body: updateMenuItemSchema }),
  menuController.updateMenuItem
);

router.delete(
  '/menu/items/:id',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'MANAGE'),
  menuController.deleteMenuItem
);

router.patch(
  '/menu/items/:id/availability',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'MANAGE'),
  menuController.toggleAvailability
);

export default router;
