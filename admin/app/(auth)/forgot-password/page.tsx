"use client";
import * as React from "react";
import Link from "next/link";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Field, FormError } from "@assistflow/shared/components/form";
import { api, ApiError } from "@assistflow/shared/api/client";
import { AuthCard } from "@/components/auth-card";

const COOLDOWN = 60;
export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState(""); const [sent, setSent] = React.useState(false); const [error, setError] = React.useState<string | null>(null); const [busy, setBusy] = React.useState(false); const [left, setLeft] = React.useState(0); const [devLink, setDevLink] = React.useState<string | null>(null);
  React.useEffect(() => { if (!left) return; const id = setInterval(() => setLeft((x) => x - 1), 1000); return () => clearInterval(id); }, [left]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try { const r = await api.post<{ ok: boolean; devLink?: string }>("/v1/auth/forgot-password", { email, portal: "admin" }, { auth: false }); setSent(true); setLeft(COOLDOWN); setDevLink(r.devLink ?? null); }
    catch (err) { setError(err instanceof ApiError ? (err.status === 429 ? "Too many attempts. Please wait a minute and try again." : err.message) : "Could not reach the server."); }
    finally { setBusy(false); }
  }
  return (
    <AuthCard title="Reset your password" subtitle="Enter your email and we'll send you a link to choose a new password." footer={<Link href="/login" className="text-brand hover:underline">Back to sign in</Link>}>
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        {sent ? <div className="rounded-md bg-success-soft px-3 py-2 text-sm"><p>If an account exists for <b>{email}</b>, a reset link is on its way. It works once and expires in 1 hour.</p><p className="mt-1 text-xs text-muted-foreground">Didn&apos;t get it? Check your spam folder{left ? `, or resend in ${left}s` : ", or resend below"}.</p>{devLink ? <p className="mt-2 break-all text-xs">Dev link: <a className="text-brand underline" href={devLink}>{devLink}</a></p> : null}</div> : null}
        <Field label="Email" htmlFor="email"><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Button type="submit" className="w-full" disabled={busy || left > 0}>{busy ? "Sending…" : left > 0 ? `Resend in ${left}s` : sent ? "Resend link" : "Send reset link"}</Button>
      </form>
    </AuthCard>
  );
}
