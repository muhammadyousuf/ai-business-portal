"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Field, FormError } from "@assistflow/shared/components/form";
import { supabaseBrowser } from "@assistflow/shared/api/supabase";
import { AuthCard } from "@/components/auth-card";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState(""); const [confirm, setConfirm] = React.useState(""); const [error, setError] = React.useState<string | null>(null); const [busy, setBusy] = React.useState(false); const [ready, setReady] = React.useState(false);
  React.useEffect(() => { supabaseBrowser().auth.getSession().then((res: { data: { session: unknown } }) => { if (!res.data.session) setError("This reset link is invalid or has expired. Request a new one."); setReady(true); }); }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (password !== confirm) return setError("Passwords do not match"); if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return setError("Use at least 8 characters with a letter and a number");
    setBusy(true); setError(null);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    setBusy(false); if (error) return setError(error.message);
    router.replace("/organizations"); router.refresh();
  }
  return (
    <AuthCard title="Choose a new password">
      {!ready ? <p className="text-sm text-muted-foreground">Checking your link…</p> : (
        <form onSubmit={submit} className="space-y-4"><FormError message={error} /><Field label="New password" htmlFor="pw"><Input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field><Field label="Confirm password" htmlFor="pw2"><Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></Field><Button type="submit" className="w-full" disabled={busy || !!error && error.includes("expired")}>{busy ? "Saving…" : "Save password"}</Button></form>
      )}
    </AuthCard>
  );
}
