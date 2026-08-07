import { Router } from 'express';
import { authRequired } from '../../middlewares/auth.middleware';
import { roleController } from './role.controller';

const router = Router();

// Apply auth middleware to all role routes
router.use(authRequired);

router.post('/', roleController.createRole);
router.get('/', roleController.getRoles);
router.get('/:id', roleController.getRoleById);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

export default router;
