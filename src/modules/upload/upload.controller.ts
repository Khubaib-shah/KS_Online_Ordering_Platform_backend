import { Request, Response, NextFunction } from 'express';
import { UploadService } from './upload.service';
import { sendSuccess } from '../../lib/api-response';
import { AppError } from '../../lib/errors';

export class UploadController {
  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantSlug, imageType } = req.body;

      if (!tenantSlug || !imageType) {
        throw new AppError('tenantSlug and imageType are required', 400, 'BAD_REQUEST');
      }

      if (!req.file) {
        throw new AppError('No image file provided', 400, 'BAD_REQUEST');
      }

      const metadata = await UploadService.uploadImage(
        req.file.buffer,
        tenantSlug,
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

      await UploadService.deleteImage(publicId);

      return sendSuccess(res, null, 200, { message: 'Image deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
