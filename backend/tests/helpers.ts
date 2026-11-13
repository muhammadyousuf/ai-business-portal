import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import supertest from "supertest";
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { createApp } from "../src/app.js";
import { connectMongo } from "../src/db/mongo.js";
import { AdminUser } from "../src/models/index.js";
import { seedCategories } from "../src/seed/categories.js";
import { createAuthUser, deleteAuthUser } from "../src/services/supabase-admin.js";

export const app = createApp();
export const api = supertest(app);
const created: string[] = [];
const anon = createClient(env.supabase.url, env.supabase.publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });

export async function setupDb() { if (mongoose.connection.readyState !== 1) await connectMongo(); await seedCategories(); }
export async function teardown() { for (const id of created.splice(0)) await deleteAuthUser(id).catch(() => undefined); }

export const randEmail = (tag = "qa") => `${tag}-${nanoid(8).toLowerCase()}@example.com`;
export const PASSWORD = "Passw0rd!test";

export async function signIn(email: string, password = PASSWORD) {
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`sign-in failed for ${email}: ${error?.message}`);
  return data.session.access_token;
}

// Creates a Supabase user directly (no org) and returns a bearer token.
export async function createAuthOnly(email = randEmail("raw")) {
  const u = await createAuthUser(email, PASSWORD, {}); created.push(u.id);
  return { email, supabaseId: u.id, token: await signIn(email) };
}

export async function createAdmin(email = randEmail("admin")) {
  const u = await createAuthUser(email, PASSWORD, { admin: true }); created.push(u.id);
  await AdminUser.create({ supabaseId: u.id, email, name: "Test Admin" });
  return { email, supabaseId: u.id, token: await signIn(email) };
}

// Full client signup through the API: user + organization (owner).
export async function signupOrg(opts: { categoryKey?: string; orgName?: string; email?: string; name?: string } = {}) {
  const email = opts.email ?? randEmail("owner");
  const res = await api.post("/v1/auth/signup").send({ email, password: PASSWORD, name: opts.name ?? "Test Owner", orgName: opts.orgName ?? `Org ${nanoid(5)}`, categoryKey: opts.categoryKey ?? "restaurant", phone: "+923001234567", city: "Karachi" });
  if (res.status !== 201) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  created.push(res.body.user.supabaseId);
  const token = await signIn(email);
  return { email, token, user: res.body.user as { id: string; supabaseId: string }, org: res.body.organization as { id: string; uuid: string; name: string; widgetKey: string } };
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

// Adds a member to an org via the invitation flow and returns their token.
export async function addMember(ownerToken: string, orgId: string, email = randEmail("member")) {
  const inv = await api.post(`/v1/orgs/${orgId}/invitations`).set(bearer(ownerToken)).send({ emails: [email] });
  const link: string = inv.body.results[0].link; const token = link.split("/invite/")[1];
  const member = await createAuthOnly(email);
  const acc = await api.post(`/v1/invitations/${token}/accept`).set(bearer(member.token));
  if (acc.status !== 200) throw new Error(`accept failed: ${acc.status} ${JSON.stringify(acc.body)}`);
  return member;
}

export async function botSession(widgetKey: string, origin = "http://localhost:5173") {
  const s = await api.post(`/v1/bot/${widgetKey}/sessions`).set("Origin", origin).send({ pageUrl: "http://localhost:5173/" });
  if (s.status !== 201) throw new Error(`bot session failed: ${s.status} ${JSON.stringify(s.body)}`);
  const token: string = s.body.sessionToken;
  const say = async (text: string) => { const r = await api.post(`/v1/bot/${widgetKey}/messages`).set("Origin", origin).set(bearer(token)).send({ text }); return r; };
  return { token, conversationId: s.body.conversationId as string, say };
}

// 1x1 PNG for upload tests
export const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
