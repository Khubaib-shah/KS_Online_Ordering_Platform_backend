import multer from "multer";
import { Request } from "express";
import { AppError } from "../../lib/errors";

const storage = multer.memoryStorage();

export function sanitizeFilename(filename: string): string {
  const segments = (filename || "")
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => segment !== "." && segment !== "..");

  const meaningfulName =
    segments.length > 1
      ? segments.slice(-2).join("-")
      : (segments.at(-1) ?? "upload");
  const sanitized = meaningfulName
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

  if (!sanitized || sanitized === "." || sanitized === "..") {
    return "upload";
  }

  return sanitized;
}

export function isAllowedImage(mimetype: string, buffer?: Buffer): boolean {
  if (!mimetype) return false;

  const normalizedMime = mimetype.toLowerCase().trim();
  const isImageMime =
    normalizedMime.startsWith("image/") ||
    normalizedMime === "application/octet-stream";

  if (!isImageMime) return false;

  // If buffer is provided, validate magic bytes header
  if (buffer && buffer.length > 0) {
    if (buffer.length < 4) return false;
    const header = buffer.subarray(0, 16);

    // PNG: 89 50 4E 47
    if (
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47
    )
      return true;

    // JPEG: FF D8 FF
    if (
      header[0] === 0xff &&
      header[1] === 0xd8 &&
      header[2] === 0xff
    )
      return true;

    // GIF: GIF87a or GIF89a (47 49 46)
    if (
      header[0] === 0x47 &&
      header[1] === 0x49 &&
      header[2] === 0x46
    )
      return true;

    // WebP: RIFF .... WEBP
    // Bytes 0-3: 'RIFF' (0x52, 0x49, 0x46, 0x46)
    // Bytes 8-11: 'WEBP' (0x57, 0x45, 0x42, 0x50)
    if (
      header.length >= 12 &&
      header[0] === 0x52 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x46 &&
      header[8] === 0x57 &&
      header[9] === 0x45 &&
      header[10] === 0x42 &&
      header[11] === 0x50
    )
      return true;

    // Also allow WebP if bytes 8-11 are WEBP
    if (
      header.length >= 12 &&
      header[8] === 0x57 &&
      header[9] === 0x45 &&
      header[10] === 0x42 &&
      header[11] === 0x50
    )
      return true;

    // AVIF: ....ftyp
    if (
      header.length >= 12 &&
      header[4] === 0x66 &&
      header[5] === 0x74 &&
      header[6] === 0x79 &&
      header[7] === 0x70
    )
      return true;

    // SVG
    const textStart = buffer.subarray(0, 100).toString("utf8").trim().toLowerCase();
    if (textStart.includes("<svg") || textStart.includes("<?xml")) {
      return true;
    }

    return false;
  }

  // If buffer is not yet available (e.g. initial Multer stream header),
  // allow standard image MIME types
  return normalizedMime.startsWith("image/");
}

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const safeName = sanitizeFilename(file.originalname || "upload");
  if (safeName !== (file.originalname || "upload")) {
    file.originalname = safeName;
  }

  const ext = (file.originalname || "").toLowerCase();
  const isAllowedExt = /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(ext);
  const normalizedMime = (file.mimetype || "").toLowerCase();
  const isAllowedMime =
    normalizedMime.startsWith("image/") ||
    (isAllowedExt && normalizedMime === "application/octet-stream");

  if (!isAllowedMime && !isAllowedExt) {
    cb(
      new AppError(
        "Invalid file type. Only valid image files are allowed.",
        400,
        "BAD_REQUEST",
      ) as any,
    );
    return;
  }

  cb(null, true);
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter,
});
