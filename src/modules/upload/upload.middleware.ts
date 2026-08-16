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
  if (!mimetype || !mimetype.startsWith("image/")) return false;
  if (!buffer || buffer.length === 0) return false;

  const header = buffer.subarray(0, 16);

  if (
    mimetype === "image/png" &&
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47
  )
    return true;
  if (
    mimetype === "image/jpeg" &&
    header[0] === 0xff &&
    header[1] === 0xd8 &&
    header[2] === 0xff
  )
    return true;
  if (
    mimetype === "image/gif" &&
    ((header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) ||
      (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46))
  )
    return true;
  if (
    mimetype === "image/webp" &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  )
    return true;
  if (
    mimetype === "image/avif" &&
    header.length >= 12 &&
    header[4] === 0x66 &&
    header[5] === 0x74 &&
    header[6] === 0x79 &&
    header[7] === 0x70
  )
    return true;

  return false;
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

  if (!isAllowedImage(file.mimetype, file.buffer)) {
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
