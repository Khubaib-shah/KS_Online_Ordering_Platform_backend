import { Router } from 'express';
import { tableController } from './table.controller';
import { authRequired } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';

const router = Router();

router.use(authRequired);

router.get('/', tableController.getTables);
router.post('/', requirePermission('settings', 'MANAGE'), tableController.createTable);
router.put('/:id', requirePermission('settings', 'MANAGE'), tableController.updateTable);
router.delete('/:id', requirePermission('settings', 'MANAGE'), tableController.deleteTable);

export { router as tableRouter };
