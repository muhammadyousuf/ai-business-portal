"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Field, FormError } from "@assistflow/shared/components/form";
import { supabaseBrowser } from "@assistflow/shared/api/supabase";
import { AuthCard } from "@/components/auth-card";

function LoginForm() {
  const router = useRouter(); const params = useSearchParams();
  const [email, setEmail] = React.useState(""); const [password, setPassword] = React.useState(""); const [error, setError] = React.useState<string | null>(params.get("error")); const [busy, setBusy] = React.useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    if (error) { setError(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message); setBusy(false); return; }
    router.replace(params.get("next") ?? "/organizations"); router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <FormError message={error} />
      <Field label="Email" htmlFor="email"><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
      <Field label="Password" htmlFor="password"><Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      <p className="text-center text-xs"><Link href="/forgot-password" className="text-brand hover:underline">Forgot your password?</Link></p>
    </form>
  );
}
export default function LoginPage() { return <AuthCard title="Welcome back" subtitle="Sign in to manage your organization." footer={<>New here? <Link href="/signup" className="text-brand hover:underline">Create your organization</Link></>}><React.Suspense><LoginForm /></React.Suspense></AuthCard>; }
