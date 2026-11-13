import { FileRecord } from "../models/index.js";
import { validateUpload } from "../middleware/upload.js";
import { putFile } from "./storage.js";

export async function saveUpload(opts: { file: Express.Multer.File | undefined; kind: "image" | "doc"; purpose: string; orgId?: string; uploaderType: "admin" | "user"; uploaderId: string }) {
  const { mime, ext } = validateUpload(opts.file, opts.kind);
  const stored = await putFile({ buffer: opts.file!.buffer, mime, ext, orgId: opts.orgId, purpose: opts.purpose });
  const rec = await FileRecord.create({ orgId: opts.orgId, uploaderType: opts.uploaderType, uploaderId: opts.uploaderId, provider: stored.provider, providerId: stored.providerId, path: stored.path, url: stored.url, mime, size: opts.file!.size, purpose: opts.purpose, originalName: opts.file!.originalname });
  return rec;
}
