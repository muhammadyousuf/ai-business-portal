"use client";
import * as React from "react";
import { MailCheck } from "lucide-react";
import { api, ApiError } from "@assistflow/shared/api/client";
import { Button } from "@assistflow/shared/ui/button";
import { useToast } from "@assistflow/shared/ui/toast";
import { useUser } from "@/lib/user-context";

// Shown on every portal page until the signup email address is confirmed. Signing in is not blocked.
export function VerifyEmailBanner() {
  const { me, refresh } = useUser(); const toast = useToast();
  const [code, setCode] = React.useState(""); const [busy, setBusy] = React.useState(false); const [err, setErr] = React.useState<string | null>(null); const [devCode, setDevCode] = React.useState<string | null>(null); const [cooldown, setCooldown] = React.useState(0);
  React.useEffect(() => { if (!cooldown) return; const t = setTimeout(() => setCooldown((c) => c - 1), 1000); return () => clearTimeout(t); }, [cooldown]);
  if (me.emailVerifiedAt) return null;
  async function verify(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await api.post("/v1/me/verify-email", { code }); toast.success("Email verified", "Thanks, your address is confirmed."); await refresh(); }
    catch (ex) { setErr(ex instanceof ApiError ? ex.message : "Could not verify"); } finally { setBusy(false); }
  }
  async function resend() {
    setBusy(true); setErr(null);
    try { const r = await api.post<{ sent: boolean; reason?: string; devCode?: string }>("/v1/me/verify-email/resend"); setCooldown(60); if (r.devCode) setDevCode(r.devCode); toast.success(r.sent ? "Code sent" : "Code issued", r.sent ? `Check ${me.email} (and spam).` : r.reason ?? "Email delivery is not configured."); }
    catch (ex) { setErr(ex instanceof ApiError ? ex.message : "Could not resend"); } finally { setBusy(false); }
  }
  return (
    <div className="border-b bg-warning-soft/60 px-4 py-2 text-sm" role="status">
      <form onSubmit={verify} className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
        <MailCheck className="size-4 text-warning" />
        <span className="mr-2">Confirm your email: we sent a 6-digit code to <b>{me.email}</b>.</span>
        <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" pattern="\d{6}" placeholder="123456" aria-label="Verification code" className="h-8 w-28 rounded-md border bg-card px-2 font-mono tracking-widest" />
        <Button type="submit" size="sm" disabled={busy || code.length !== 6}>Verify</Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy || cooldown > 0} onClick={resend}>{cooldown ? `Resend in ${cooldown}s` : "Resend code"}</Button>
        {err ? <span className="text-destructive">{err}</span> : null}
        {devCode ? <span className="text-xs text-muted-foreground">Development only · code: <span className="font-mono">{devCode}</span></span> : null}
      </form>
    </div>
  );
}
