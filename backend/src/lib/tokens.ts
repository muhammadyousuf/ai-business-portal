import { createHash, randomBytes, randomUUID } from "node:crypto";
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const uuid = () => randomUUID();
export const widgetKey = () => `wk_${randomBytes(12).toString("base64url")}`;
export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "org";
