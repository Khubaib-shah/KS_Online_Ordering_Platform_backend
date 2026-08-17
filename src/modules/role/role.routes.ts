// ─── Role Routes ────────────────────────────────────────────────────
// Role CRUD — gated by authRequired → tenantResolver → requirePermission('roles', ...).

import { Router } from 'express';
import { authRequired } from '../../middlewares/auth.middleware';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { roleController } from './role.controller';

const router = Router();

// Apply auth + tenant resolver to all role routes
router.use(authRequired);
router.use(tenantResolver());

// Read operations
router.get('/', requirePermission('roles', 'View'), roleController.getRoles);
router.get('/:id', requirePermission('roles', 'View'), roleController.getRoleById);

// Write operations
router.post('/', requirePermission('roles', 'Create'), roleController.createRole);
router.put('/:id', requirePermission('roles', 'Edit'), roleController.updateRole);
router.delete('/:id', requirePermission('roles', 'Delete'), roleController.deleteRole);

export default router;
