import { Router } from 'express';
import { UploadController } from './upload.controller';
import { uploadMiddleware } from './upload.middleware';

const router = Router();

// POST /api/v1/upload
router.post('/', uploadMiddleware.single('file'), UploadController.uploadImage);

// DELETE /api/v1/upload
router.delete('/', UploadController.deleteImage);

export default router;
