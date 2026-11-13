import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { badRequest, conflict, unauthorized } from "../lib/http-error.js";

// Service-role client: user creation, invitations, password updates. Never exposed to browsers.
export const supabaseAdmin = createClient(env.supabase.url, env.supabase.serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

export async function createAuthUser(email: string, password: string, meta: Record<string, unknown> = {}) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta });
  if (error) {
    if (/already|exists|registered/i.test(error.message)) throw conflict("An account with this email already exists");
    throw badRequest(error.message);
  }
  return data.user;
}

export async function findAuthUserByEmail(email: string) {
  // listUsers has no email filter in all versions; page through a small window.
  const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return data?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function inviteByEmail(email: string, redirectTo: string, meta: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo, data: meta });
  if (error) return { sent: false, reason: error.message };
  return { sent: true, user: data.user };
}

export async function deleteAuthUser(id: string) { await supabaseAdmin.auth.admin.deleteUser(id); }

export async function setPassword(id: string, password: string, opts: { confirmEmail?: boolean; meta?: Record<string, unknown> } = {}) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password, ...(opts.confirmEmail ? { email_confirm: true } : {}), ...(opts.meta ? { user_metadata: opts.meta } : {}) });
  if (error) throw badRequest(error.message);
}

// Used by change-password to verify the current password. Needs the publishable key.
export async function verifyPassword(email: string, password: string) {
  if (!env.supabase.publishableKey) throw badRequest("Password verification is not configured");
  const client = createClient(env.supabase.url, env.supabase.publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw unauthorized("Current password is incorrect");
  return data.session;
}

export async function generateRecoveryLink(email: string, redirectTo: string) {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo } });
  if (error) throw badRequest(error.message);
  return data.properties.action_link;
}
