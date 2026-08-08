import { Router } from 'express';
import { shiftController } from './shift.controller';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';
import { authRequired } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authRequired);
router.use(tenantResolver());

router.get('/me/active', shiftController.getMyActiveShift);
router.get('/me/previous', shiftController.getMyPreviousShift);
router.get('/branch', shiftController.getBranchShifts);
router.get('/branch/history', shiftController.getBranchShiftHistory);

export default router;
