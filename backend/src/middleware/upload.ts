import multer from "multer";
import { badRequest } from "../lib/http-error.js";

export const IMAGE_MIMES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
export const DOC_MIMES: Record<string, string> = { ...IMAGE_MIMES, "application/pdf": "pdf" };
export const MAX_IMAGE = 5 * 1024 * 1024;
export const MAX_DOC = 10 * 1024 * 1024;

// Magic-byte sniffing so a renamed .exe cannot pass as an image.
export function detectMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf.subarray(1, 4).toString("ascii") === "PNG") return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "GIF8") return "image/gif";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}

export const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE, files: 1 } }).single("file");
export const docUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_DOC, files: 1 } }).single("file");

export function validateUpload(file: Express.Multer.File | undefined, kind: "image" | "doc") {
  if (!file) throw badRequest("No file uploaded (field name must be 'file')");
  const allowed = kind === "image" ? IMAGE_MIMES : DOC_MIMES;
  const mime = detectMime(file.buffer);
  if (!mime || !allowed[mime]) throw badRequest(`Unsupported file type. Allowed: ${Object.keys(allowed).join(", ")}`);
  const max = kind === "image" ? MAX_IMAGE : MAX_DOC;
  if (file.size > max) throw badRequest(`File too large (max ${Math.round(max / 1024 / 1024)} MB)`);
  return { mime, ext: allowed[mime] };
}
