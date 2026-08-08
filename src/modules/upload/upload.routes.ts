import { Router } from 'express';
import { UploadController } from './upload.controller';
import { uploadMiddleware } from './upload.middleware';
import { authRequired } from '../../middlewares/auth.middleware';

const router = Router();

// POST /api/v1/upload
router.post('/', authRequired, uploadMiddleware.single('file'), UploadController.uploadImage);

// DELETE /api/v1/upload
router.delete('/', authRequired, UploadController.deleteImage);

export default router;
