import cloudinary from '../../lib/cloudinary';
import { AppError } from '../../lib/errors';

export interface CloudinaryImageMetadata {
  publicId: string;
  secureUrl: string;
  resourceType: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  createdAt: string;
}

export class UploadService {
  /**
   * Uploads an image buffer to Cloudinary
   */
  static async uploadImage(
    fileBuffer: Buffer,
    tenantSlug: string,
    imageType: string
  ): Promise<CloudinaryImageMetadata> {
    try {
      const folderPath = `shopes/${tenantSlug}/${imageType}`;

      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folderPath,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(fileBuffer);
      });

      return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        resourceType: result.resource_type,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format,
        createdAt: result.created_at,
      };
    } catch (error) {
      throw new AppError('Failed to upload image to Cloudinary', 500, 'INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Deletes an image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new AppError('Failed to delete image from Cloudinary', 500, 'INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Replaces an image by deleting the old one and uploading a new one
   */
  static async replaceImage(
    fileBuffer: Buffer,
    oldPublicId: string,
    tenantSlug: string,
    imageType: string
  ): Promise<CloudinaryImageMetadata> {
    if (oldPublicId) {
      await this.deleteImage(oldPublicId);
    }
    return this.uploadImage(fileBuffer, tenantSlug, imageType);
  }
}
