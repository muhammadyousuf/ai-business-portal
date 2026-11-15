import { randomInt } from "node:crypto";
import { env } from "../config/env.js";
import { HttpError, badRequest } from "../lib/http-error.js";
const tooMany = (m: string) => new HttpError(429, m, "rate_limited");
import { sha256 } from "../lib/tokens.js";
import { User, type UserDoc } from "../models/index.js";
import { sendWelcomeVerification } from "./email.js";

const TTL_MS = 30 * 60 * 1000; const RESEND_GAP_MS = 60 * 1000; const MAX_ATTEMPTS = 8;

// Sends a fresh 6-digit code (and the welcome email that carries it). Outside production the code is also returned
// so the flow can be exercised without a mailbox.
export async function issueVerification(user: UserDoc, orgName?: string) {
  const current = await User.findById(user._id).select("+emailVerification");
  const last = current?.emailVerification?.sentAt?.getTime() ?? 0;
  if (Date.now() - last < RESEND_GAP_MS) throw tooMany("Please wait a minute before requesting another code");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await User.updateOne({ _id: user._id }, { $set: { emailVerification: { codeHash: sha256(code), expiresAt: new Date(Date.now() + TTL_MS), sentAt: new Date(), attempts: 0 } } });
  const link = `${env.urls.userApp}/verify-email?code=${code}`;
  const r = await sendWelcomeVerification(user.email, user.name, code, link, orgName);
  return { sent: r.sent, reason: r.sent ? undefined : r.reason, ...(env.isDev || env.isTest ? { devCode: code } : {}) };
}

export async function verifyEmailCode(userId: string, code: string) {
  const u = await User.findById(userId).select("+emailVerification");
  if (!u) throw badRequest("User not found");
  if (u.emailVerifiedAt) return { alreadyVerified: true };
  const v = u.emailVerification;
  if (!v?.codeHash || !v.expiresAt) throw badRequest("No verification code was issued. Request a new one.");
  if (v.expiresAt.getTime() < Date.now()) throw badRequest("This code has expired. Request a new one.");
  if ((v.attempts ?? 0) >= MAX_ATTEMPTS) throw tooMany("Too many attempts. Request a new code.");
  if (sha256(code.trim()) !== v.codeHash) { await User.updateOne({ _id: u._id }, { $inc: { "emailVerification.attempts": 1 } }); throw badRequest("That code is not right. Check the email and try again."); }
  await User.updateOne({ _id: u._id }, { $set: { emailVerifiedAt: new Date() }, $unset: { emailVerification: 1 } });
  return { alreadyVerified: false };
}
