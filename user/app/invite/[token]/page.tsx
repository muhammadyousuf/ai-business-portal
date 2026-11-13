"use client";
import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Field, FormError } from "@assistflow/shared/components/form";
import { BrandMark } from "@assistflow/shared/components/brand-mark";
import { api, ApiError } from "@assistflow/shared/api/client";
import { supabaseBrowser } from "@assistflow/shared/api/supabase";
import { AuthCard } from "@/components/auth-card";

interface Inv { email: string; role: string; status: string; expiresAt: string; organization: { id: string; name: string; logoUrl: string; category: string }; invitedBy: string; accountExists: boolean }

export default function InvitePage() {
  const { token } = useParams<{ token: string }>(); const router = useRouter();
  const [inv, setInv] = React.useState<Inv | null>(null); const [error, setError] = React.useState<string | null>(null); const [session, setSession] = React.useState<{ email: string; needsPassword: boolean } | null | undefined>(undefined);
  const [name, setName] = React.useState(""); const [password, setPassword] = React.useState(""); const [busy, setBusy] = React.useState(false);
  React.useEffect(() => {
    api.get<{ invitation: Inv }>(`/v1/invitations/${token}`, { auth: false }).then((r) => setInv(r.invitation)).catch((e) => setError(e instanceof ApiError ? e.message : "Could not load invitation"));
    supabaseBrowser().auth.getSession().then((res: { data: { session: { user?: { email?: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown>; last_sign_in_at?: string; created_at?: string; invited_at?: string } } | null } }) => { const u = res.data.session?.user; setSession(u ? { email: (u.email ?? "").toLowerCase(), needsPassword: u.app_metadata?.provider === "email" && !u.user_metadata?.password_set && (u.last_sign_in_at === u.created_at || !!u.invited_at) } : null); });
  }, [token]);
  async function accept() {
    setBusy(true); setError(null);
    try { const r = await api.post<{ organization: { id: string } }>(`/v1/invitations/${token}/accept`); router.replace(`/org/${r.organization.id}`); router.refresh(); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Failed to accept"); setBusy(false); }
  }
  async function signupAndAccept(e: React.FormEvent) {
    e.preventDefault(); if (!inv) return; setBusy(true); setError(null);
    try {
      const sb = supabaseBrowser();
      if (session && session.email === inv.email) {
        // Arrived through Supabase's invite email: already has a session, only needs a password and name.
        const { error } = await sb.auth.updateUser({ password, data: { name, password_set: true } }); if (error) throw new Error(error.message);
        await api.patch("/v1/me", { name });
        await accept(); return;
      }
      // Brand-new account: created server-side (auto-confirmed) and joined in one step, then sign in.
      const r = await api.post<{ organization: { id: string } }>(`/v1/invitations/${token}/signup`, { name, password }, { auth: false });
      const { error: le } = await sb.auth.signInWithPassword({ email: inv.email, password }); if (le) throw new Error(le.message);
      router.replace(`/org/${r.organization.id}`); router.refresh();
    } catch (err) { setError(err instanceof ApiError ? err.message : (err as Error).message); setBusy(false); }
  }
  if (error && !inv) return <AuthCard title="Invitation unavailable"><FormError message={error} /><Button asChild variant="outline"><Link href="/login">Go to sign in</Link></Button></AuthCard>;
  if (!inv || session === undefined) return <AuthCard title="Loading invitation…"><p className="text-sm text-muted-foreground">One moment.</p></AuthCard>;
  const org = inv.organization;
  const header = <div className="flex items-center gap-3 rounded-lg border p-3">{org.logoUrl ? <img src={org.logoUrl} alt="" className="size-10 rounded-lg object-cover" /> : <BrandMark text={org.name.slice(0, 1).toUpperCase()} className="size-10" />}<div><p className="font-medium">{org.name}</p><p className="text-xs text-muted-foreground">{org.category} · invited by {inv.invitedBy || "the owner"} · as {inv.role}</p></div></div>;
  if (inv.status !== "pending") return <AuthCard title="Invitation no longer valid">{header}<p className="text-sm text-muted-foreground">This invitation is {inv.status}. Ask the organization to send a new one.</p><Button asChild variant="outline"><Link href="/login">Go to sign in</Link></Button></AuthCard>;
  if (session && session.email === inv.email && !session.needsPassword) return <AuthCard title={`Join ${org.name}`} subtitle={`Signed in as ${session.email}.`}>{header}<FormError message={error} /><Button className="w-full" onClick={accept} disabled={busy}>{busy ? "Joining…" : "Accept invitation"}</Button></AuthCard>;
  if (session && session.email !== inv.email) return <AuthCard title="Wrong account" subtitle={`This invitation is for ${inv.email}, but you are signed in as ${session.email}.`}>{header}<Button className="w-full" variant="outline" onClick={async () => { await supabaseBrowser().auth.signOut(); setSession(null); }}>Sign out and continue</Button></AuthCard>;
  if (inv.accountExists && !session) return <AuthCard title={`Join ${org.name}`} subtitle={`Sign in as ${inv.email} to accept.`}>{header}<Button className="w-full" asChild><Link href={`/login?next=/invite/${token}`}>Sign in to accept</Link></Button></AuthCard>;
  return (
    <AuthCard title={`Join ${org.name}`} subtitle="Create your account to accept the invitation.">
      {header}
      <form onSubmit={signupAndAccept} className="space-y-4"><FormError message={error} /><Field label="Email"><Input value={inv.email} disabled /></Field><Field label="Your name" required><Input value={name} onChange={(e) => setName(e.target.value)} required /></Field><Field label="Password" hint="8+ characters with a letter and a number" required><Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field><Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account and join"}</Button></form>
    </AuthCard>
  );
}
