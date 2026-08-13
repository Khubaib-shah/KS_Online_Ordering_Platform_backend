import { Router } from 'express';
import { UploadController } from './upload.controller';
import { uploadMiddleware } from './upload.middleware';
import { authRequired } from '../../middlewares/auth.middleware';
import { tenantResolver } from '../../middlewares/tenant-resolver.middleware';

const router = Router();

// POST /api/v1/upload
// tenantResolver(required: false) so the Super Admin create wizard can upload
// before the tenant exists (falls back to the tenantSlug form field).
router.post(
  '/',
  authRequired,
  tenantResolver({ required: false }),
  uploadMiddleware.single('file'),
  UploadController.uploadImage
);

// DELETE /api/v1/upload
// Tenant-scoped: only images owned by the authenticated tenant context may be deleted.
router.delete(
  '/',
  authRequired,
  tenantResolver(),
  UploadController.deleteImage
);

export default router;
