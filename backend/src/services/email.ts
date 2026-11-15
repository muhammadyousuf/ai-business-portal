import { Resend } from "resend";
import { env } from "../config/env.js";
import { log } from "../lib/logger.js";

// All outbound email goes through here. Without RESEND_API_KEY (and always in tests) nothing is sent;
// the link is logged so the flow can still be exercised locally.
const resend = env.email.resendApiKey ? new Resend(env.email.resendApiKey) : null;
export const emailEnabled = () => !!resend;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
function layout(title: string, bodyHtml: string, cta?: { label: string; url: string }, footer = "") {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#18181b">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" style="max-width:520px;background:#fff;border:1px solid #e4e4e7;border-radius:12px"><tr><td style="padding:28px 28px 8px">
    <div style="display:inline-block;width:32px;height:32px;border-radius:8px;background:#4f46e5;color:#fff;font-weight:700;text-align:center;line-height:32px">A</div>
    <span style="margin-left:8px;font-weight:600">AssistFlow</span>
    <h1 style="font-size:20px;margin:20px 0 8px">${esc(title)}</h1>
    <div style="font-size:14px;line-height:1.6;color:#3f3f46">${bodyHtml}</div>
    ${cta ? `<p style="margin:22px 0"><a href="${cta.url}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600;font-size:14px">${esc(cta.label)}</a></p><p style="font-size:12px;color:#71717a;word-break:break-all">Or copy this link: ${cta.url}</p>` : ""}
    <p style="font-size:12px;color:#71717a;margin-top:24px">${footer}</p>
  </td></tr></table></td></tr></table></body></html>`;
}

export async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!resend) { log.info("email not configured, skipping", { to, subject, text }); return { sent: false as const, reason: "email_not_configured" }; }
  const { error } = await resend.emails.send({ from: env.email.from, to, subject, html, text });
  if (error) { log.warn("email send failed", { to, subject, error: error.message }); return { sent: false as const, reason: error.message }; }
  log.info("email sent", { to, subject });
  return { sent: true as const };
}

export function sendPasswordReset(to: string, link: string, portal: "admin" | "client") {
  const where = portal === "admin" ? "the AssistFlow admin portal" : "AssistFlow";
  return sendEmail(to, "Reset your AssistFlow password",
    layout("Reset your password", `<p>We received a request to reset the password for <b>${esc(to)}</b> on ${where}.</p><p>This link works once and expires in 1 hour.</p>`, { label: "Choose a new password", url: link }, "If you didn't request this, you can ignore this email. Your password will not change."),
    `Reset your AssistFlow password\n\nOpen this link (valid for 1 hour): ${link}\n\nIf you didn't request this, ignore this email.`);
}

export function sendInvitation(to: string, link: string, orgName: string, inviter: string, role: string) {
  return sendEmail(to, `${inviter} invited you to ${orgName} on AssistFlow`,
    layout(`Join ${orgName}`, `<p><b>${esc(inviter)}</b> invited you to join <b>${esc(orgName)}</b> as a ${esc(role)}.</p><p>Accept the invitation to manage the chatbot, inbox and orders together.</p>`, { label: "Accept invitation", url: link }, "This invitation expires in 7 days. If you weren't expecting it, you can ignore this email."),
    `${inviter} invited you to ${orgName} on AssistFlow.\n\nAccept here (expires in 7 days): ${link}`);
}
