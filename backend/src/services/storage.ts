import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

export interface StoredFile { provider: "local" | "cloudinary"; providerId: string; path: string; url: string }
export interface PutInput { buffer: Buffer; mime: string; ext: string; orgId?: string; purpose: string }

// Supabase is auth-only, so files go to Cloudinary (when CLOUDINARY_URL is set) or local disk.
const useCloudinary = !!env.cloudinaryUrl;
if (useCloudinary) cloudinary.config({ secure: true });

export async function putFile(input: PutInput): Promise<StoredFile> {
  const folder = `${input.orgId ?? "platform"}/${input.purpose}`;
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}`;
  if (useCloudinary) {
    const res = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: `assistflow/${folder}`, public_id: name, resource_type: input.mime === "application/pdf" ? "raw" : "image" }, (err, r) => (err || !r ? reject(err) : resolve(r))).end(input.buffer);
    });
    return { provider: "cloudinary", providerId: res.public_id, path: res.public_id, url: res.secure_url };
  }
  const rel = path.posix.join(folder, `${name}.${input.ext}`);
  const abs = path.join(process.cwd(), env.uploadDir, rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, input.buffer);
  return { provider: "local", providerId: rel, path: rel, url: `${env.urls.api}/uploads/${rel}` };
}

export async function removeFile(f: { provider: string; providerId: string }) {
  try {
    if (f.provider === "cloudinary") await cloudinary.uploader.destroy(f.providerId);
    else await unlink(path.join(process.cwd(), env.uploadDir, f.providerId));
  } catch { /* best effort */ }
}
