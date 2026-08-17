import { Router } from 'express';
import { shiftController } from './shift.controller';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { authRequired } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { resolveScope } from '../../middlewares/scope-resolver.middleware';

const router = Router();

router.use(authRequired);
router.use(tenantResolver());

// Personal shift endpoints — no branch scope needed (user's own shifts)
router.get('/me/active', shiftController.getMyActiveShift);
router.get('/me/previous', shiftController.getMyPreviousShift);

// Branch shift endpoints — require branch scope enforcement
router.get('/branch', requirePermission('pos', 'View'), resolveScope(), shiftController.getBranchShifts);
router.get('/branch/history', requirePermission('pos', 'View'), resolveScope(), shiftController.getBranchShiftHistory);

export default router;
