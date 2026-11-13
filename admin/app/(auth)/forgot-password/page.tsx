"use client";
import * as React from "react";
import Link from "next/link";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Field, FormError } from "@assistflow/shared/components/form";
import { supabaseBrowser } from "@assistflow/shared/api/supabase";
import { AuthCard } from "@/components/auth-card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState(""); const [sent, setSent] = React.useState(false); const [error, setError] = React.useState<string | null>(null); const [busy, setBusy] = React.useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
    setBusy(false); if (error) setError(error.message); else setSent(true);
  }
  return (
    <AuthCard title="Reset your password" subtitle="We'll email you a link to choose a new password." footer={<Link href="/login" className="text-brand hover:underline">Back to sign in</Link>}>
      {sent ? <p className="rounded-md bg-success-soft px-3 py-2 text-sm">If an account exists for {email}, a reset link is on its way. Check your inbox.</p> : (
        <form onSubmit={submit} className="space-y-4"><FormError message={error} /><Field label="Email" htmlFor="email"><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field><Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Button></form>
      )}
    </AuthCard>
  );
}
