import type { RequestHandler } from "express";
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import { createHash } from "node:crypto";
import { env } from "../config/env.js";
import { forbidden, unauthorized } from "../lib/http-error.js";
import { AdminUser, User } from "../models/index.js";
import { supabaseAdmin } from "../services/supabase-admin.js";

const jwks = createRemoteJWKSet(new URL(env.supabase.jwksUrl));
const issuer = `${env.supabase.url}/auth/v1`;
const hsSecret = env.supabase.jwtSecret ? new TextEncoder().encode(env.supabase.jwtSecret) : null;

// Fallback for HS256 tokens when the legacy secret is not configured: ask the auth server, cache briefly.
const remoteCache = new Map<string, { sub: string; email: string; until: number }>();
async function verifyRemote(token: string) {
  const key = createHash("sha256").update(token).digest("hex");
  const hit = remoteCache.get(key);
  if (hit && hit.until > Date.now()) return { sub: hit.sub, email: hit.email };
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw unauthorized("Invalid or expired token");
  const out = { sub: data.user.id, email: (data.user.email ?? "").toLowerCase() };
  remoteCache.set(key, { ...out, until: Date.now() + 2 * 60_000 });
  if (remoteCache.size > 5000) remoteCache.clear();
  return out;
}

export async function verifyAccessToken(token: string): Promise<{ sub: string; email: string }> {
  let header: { alg?: string };
  try { header = decodeProtectedHeader(token); } catch { throw unauthorized("Invalid token"); }
  try {
    if (header.alg === "HS256") {
      if (!hsSecret) return await verifyRemote(token);
      const { payload } = await jwtVerify(token, hsSecret, { issuer, audience: "authenticated" });
      return { sub: String(payload.sub), email: String(payload.email ?? "").toLowerCase() };
    }
    const { payload } = await jwtVerify(token, jwks, { issuer, audience: "authenticated" });
    if (!payload.sub) throw unauthorized("Invalid token");
    return { sub: payload.sub, email: String(payload.email ?? "").toLowerCase() };
  } catch (e) {
    if ((e as { status?: number }).status) throw e;
    throw unauthorized("Invalid or expired token");
  }
}

// Verifies the Supabase access token. Roles are never read from the token; they come from Mongo.
export const requireJwt: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw unauthorized();
    req.auth = await verifyAccessToken(token);
    next();
  } catch (e) { next(e); }
};

// Client principal: the Mongo user record. Created lazily on first sight (signup creates it explicitly).
export const requireUser: RequestHandler = async (req, _res, next) => {
  try {
    if (!req.auth) throw unauthorized();
    let user = await User.findOne({ supabaseId: req.auth.sub });
    if (!user) user = await User.create({ supabaseId: req.auth.sub, email: req.auth.email, name: "" });
    req.user = user;
    next();
  } catch (e) { next(e); }
};

// Admin principal: must exist in admin_users. Never auto-created.
export const requireAdmin: RequestHandler = async (req, _res, next) => {
  try {
    if (!req.auth) throw unauthorized();
    const admin = await AdminUser.findOne({ supabaseId: req.auth.sub });
    if (!admin) throw forbidden("This account is not an admin account");
    req.admin = admin;
    next();
  } catch (e) { next(e); }
};
