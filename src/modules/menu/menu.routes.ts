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
  requirePermission('menu', 'View'),
  menuController.listCategories
);

router.post(
  '/menu/categories',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'Create'),
  validate({ body: createCategorySchema }),
  menuController.createCategory
);

router.put(
  '/menu/categories/:id',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'Edit'),
  validate({ body: updateCategorySchema }),
  menuController.updateCategory
);

router.delete(
  '/menu/categories/:id',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'Delete'),
  menuController.deleteCategory
);

// ── Admin: Menu Items ──
router.get(
  '/menu/items',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'View'),
  validate({ query: listMenuItemsQuerySchema }),
  menuController.listMenuItems
);

router.get(
  '/menu/items/:id',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'View'),
  menuController.getMenuItem
);

router.post(
  '/menu/items',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'Create'),
  validate({ body: createMenuItemSchema }),
  menuController.createMenuItem
);

router.put(
  '/menu/items/:id',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'Edit'),
  validate({ body: updateMenuItemSchema }),
  menuController.updateMenuItem
);

router.delete(
  '/menu/items/:id',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'Delete'),
  menuController.deleteMenuItem
);

router.patch(
  '/menu/items/:id/availability',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'Edit'),
  menuController.toggleAvailability
);

router.patch(
  '/menu/items/:id/online-availability',
  authRequired,
  tenantResolver(),
  requirePermission('menu', 'Edit'),
  menuController.toggleOnlineAvailability
);

export default router;
