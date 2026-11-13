"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Select } from "@assistflow/shared/ui/select";
import { Field, FormError, fieldErrors } from "@assistflow/shared/components/form";
import { api, ApiError } from "@assistflow/shared/api/client";
import { supabaseBrowser } from "@assistflow/shared/api/supabase";
import { AuthCard } from "@/components/auth-card";

export default function SignupPage() {
  const router = useRouter();
  const [cats, setCats] = React.useState<{ key: string; name: string; description: string }[]>([]);
  const [f, setF] = React.useState({ name: "", email: "", password: "", orgName: "", categoryKey: "", phone: "", city: "" });
  const [error, setError] = React.useState<string | null>(null); const [errors, setErrors] = React.useState<Record<string, string>>({}); const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { api.get<{ items: typeof cats }>("/v1/auth/categories", { auth: false }).then((r) => { setCats(r.items); setF((x) => ({ ...x, categoryKey: x.categoryKey || r.items[0]?.key || "" })); }).catch(() => setError("Could not load categories. Is the backend running?")); }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null); setErrors({});
    try {
      const r = await api.post<{ organization: { uuid: string } }>("/v1/auth/signup", f, { auth: false });
      const { error } = await supabaseBrowser().auth.signInWithPassword({ email: f.email, password: f.password });
      if (error) throw new Error(error.message);
      router.replace(`/org/${r.organization.uuid}`); router.refresh();
    } catch (err) { if (err instanceof ApiError) { setError(err.message); setErrors(fieldErrors(err.details)); } else setError((err as Error).message); setBusy(false); }
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <AuthCard wide title="Create your organization" subtitle="You become the owner. Invite your team afterwards." footer={<>Already have an account? <Link href="/login" className="text-brand hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" error={errors.name} required><Input value={f.name} onChange={set("name")} required /></Field>
          <Field label="Email" error={errors.email} required><Input type="email" autoComplete="email" value={f.email} onChange={set("email")} required /></Field>
          <Field label="Password" error={errors.password} hint="8+ characters with a letter and a number" required><Input type="password" autoComplete="new-password" value={f.password} onChange={set("password")} required /></Field>
          <Field label="Phone" error={errors.phone}><Input value={f.phone} onChange={set("phone")} placeholder="+92 300 1234567" /></Field>
        </div>
        <div className="rounded-lg border p-4"><p className="mb-3 text-sm font-medium">Organization</p><div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" error={errors.orgName} required><Input value={f.orgName} onChange={set("orgName")} placeholder="Kababjees" required /></Field>
          <Field label="Category" error={errors.categoryKey} required><Select value={f.categoryKey} onChange={set("categoryKey")}>{cats.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}</Select></Field>
          <Field label="City" error={errors.city}><Input value={f.city} onChange={set("city")} placeholder="Karachi" /></Field>
        </div>{cats.find((c) => c.key === f.categoryKey)?.description ? <p className="mt-2 text-xs text-muted-foreground">{cats.find((c) => c.key === f.categoryKey)?.description}</p> : null}</div>
        <Button type="submit" className="w-full" disabled={busy || !cats.length}>{busy ? "Creating…" : "Create organization"}</Button>
      </form>
    </AuthCard>
  );
}
