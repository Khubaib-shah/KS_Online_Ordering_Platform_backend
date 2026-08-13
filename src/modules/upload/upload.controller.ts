import { Request, Response, NextFunction } from 'express';
import { UploadService } from './upload.service';
import { sendSuccess } from '../../lib/api-response';
import { AppError, ForbiddenError } from '../../lib/errors';

export class UploadController {
  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { imageType, tenantSlug } = req.body;
      // Prefer the resolved tenant context; fall back to the form field so the
      // Super Admin create wizard can upload before the tenant exists.
      const tenantId = req.tenantId || (typeof tenantSlug === 'string' && tenantSlug.trim() ? tenantSlug.trim() : undefined);

      if (!imageType) {
        throw new AppError('imageType is required', 400, 'BAD_REQUEST');
      }

      if (!req.file) {
        throw new AppError('No image file provided', 400, 'BAD_REQUEST');
      }

      if (!tenantId) {
        throw new AppError('Tenant identification is required (X-Tenant-Id header or tenantSlug form field)', 400, 'TENANT_REQUIRED');
      }

      const metadata = await UploadService.uploadImage(
        req.file.buffer,
        tenantId, // Prefixing with tenant ID instead of arbitrary slug
        imageType
      );

      return sendSuccess(res, metadata, 200, { message: 'Image uploaded successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { publicId } = req.body;

      if (!publicId) {
        throw new AppError('publicId is required', 400, 'BAD_REQUEST');
      }

      // Ownership guard: only images stored under this tenant's folder may be deleted.
      const tenantId = req.tenantId;
      if (!tenantId) {
        throw new ForbiddenError('Tenant context required to delete images');
      }
      if (typeof publicId !== 'string' || !publicId.startsWith(`shopes/${tenantId}/`)) {
        throw new ForbiddenError('You do not have permission to delete this image');
      }

      await UploadService.deleteImage(publicId);

      return sendSuccess(res, null, 200, { message: 'Image deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
