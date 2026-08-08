import { Router } from 'express';
import { tableController } from './table.controller';
import { authRequired } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';

const router = Router();

router.use(authRequired);

router.get('/', tableController.getTables);
router.post('/', requirePermission('settings', 'Create'), tableController.createTable);
router.put('/:id', requirePermission('settings', 'Edit'), tableController.updateTable);
router.delete('/:id', requirePermission('settings', 'Delete'), tableController.deleteTable);

export { router as tableRouter };
