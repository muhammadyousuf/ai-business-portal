"use client";
import * as React from "react";
import { Camera } from "lucide-react";
import { api, ApiError } from "@assistflow/shared/api/client";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Switch } from "@assistflow/shared/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@assistflow/shared/ui/tabs";
import { Field, FormError, fieldErrors } from "@assistflow/shared/components/form";
import { UserAvatar } from "@assistflow/shared/components/user-avatar";
import { useToast } from "@assistflow/shared/ui/toast";

export interface Account { id: string; email: string; name: string; phone: string; avatarUrl: string; notificationPrefs: Record<string, boolean> }
const PREFS: [string, string][] = [["newOrders", "New orders and order status changes"], ["newMessages", "New customer messages in conversations you handle"], ["needsHuman", "A customer needs a human"], ["appointments", "Appointment and inquiry requests"], ["members", "Members joining or leaving"], ["email", "Also send me emails (coming in Phase 2)"]];

export function AccountSettings({ base, account, onChange, title = "Account settings", extra }: { base: "/v1/me" | "/v1/admin/me"; account: Account; onChange: () => Promise<void>; title?: string; extra?: React.ReactNode }) {
  const toast = useToast();
  const [name, setName] = React.useState(account.name); const [phone, setPhone] = React.useState(account.phone); const [busy, setBusy] = React.useState(false); const [err, setErr] = React.useState<string | null>(null); const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pw, setPw] = React.useState({ current: "", next: "", confirm: "" }); const [pwErr, setPwErr] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const key = (k: string) => (base === "/v1/me" ? `${base}/${k}` : `${base}/${k}`);
  async function saveProfile() { setBusy(true); setErr(null); try { await api.patch(base, { name, phone }); toast.success("Profile saved"); await onChange(); } catch (e) { if (e instanceof ApiError) { setErr(e.message); setErrors(fieldErrors(e.details)); } } finally { setBusy(false); } }
  async function upload(f: File) { try { await api.upload(key("avatar"), f); toast.success("Photo updated"); await onChange(); } catch (e) { toast.error("Upload failed", (e as Error).message); } }
  async function togglePref(k: string, v: boolean) { try { await api.patch(key("notification-preferences"), { [k]: v }); await onChange(); } catch (e) { toast.error("Could not save", (e as Error).message); } }
  async function changePassword() { setPwErr(null); if (pw.next !== pw.confirm) return setPwErr("New passwords do not match"); setBusy(true); try { await api.post(key("change-password"), { currentPassword: pw.current, newPassword: pw.next }); toast.success("Password changed"); setPw({ current: "", next: "", confirm: "" }); } catch (e) { setPwErr(e instanceof ApiError ? e.message : "Failed"); } finally { setBusy(false); } }
  return (
    <>
      <PageHeader title={title} description={account.email} />
      <Tabs defaultValue="profile">
        <TabsList><TabsTrigger value="profile">Profile</TabsTrigger><TabsTrigger value="notifications">Notifications</TabsTrigger><TabsTrigger value="security">Security</TabsTrigger>{extra ? <TabsTrigger value="extra">Organizations</TabsTrigger> : null}</TabsList>
        <TabsContent value="profile">
          <Card><CardHeader><CardTitle>Profile</CardTitle><CardDescription>Shown to your team and in activity logs.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">{account.avatarUrl ? <img src={account.avatarUrl} alt="" className="size-16 rounded-full object-cover" /> : <UserAvatar name={account.name || account.email} className="size-16 [&_span]:text-lg" />}<div><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /><Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Camera /> Upload photo</Button><p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP or GIF up to 5 MB.</p></div></div>
              <FormError message={err} />
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Full name" error={errors.name}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field><Field label="Phone" error={errors.phone}><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field><Field label="Email" hint="Email changes are handled by support."><Input value={account.email} disabled /></Field></div>
              <div className="flex justify-end"><Button onClick={saveProfile} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button></div>
            </CardContent></Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card><CardHeader><CardTitle>Notification preferences</CardTitle><CardDescription>In-app notifications. Email delivery arrives in Phase 2.</CardDescription></CardHeader>
            <CardContent className="divide-y">{PREFS.map(([k, label]) => <div key={k} className="flex items-center justify-between py-3 text-sm"><span>{label}</span><Switch checked={account.notificationPrefs?.[k] ?? k !== "email"} onCheckedChange={(v) => togglePref(k, v)} aria-label={label} /></div>)}</CardContent></Card>
        </TabsContent>
        <TabsContent value="security">
          <Card><CardHeader><CardTitle>Change password</CardTitle><CardDescription>At least 8 characters with a letter and a number.</CardDescription></CardHeader>
            <CardContent className="space-y-4"><FormError message={pwErr} /><div className="grid gap-4 sm:grid-cols-3"><Field label="Current password"><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field><Field label="New password"><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field><Field label="Confirm"><Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field></div><div className="flex justify-end"><Button onClick={changePassword} disabled={busy || !pw.current || !pw.next}>Change password</Button></div></CardContent></Card>
        </TabsContent>
        {extra ? <TabsContent value="extra">{extra}</TabsContent> : null}
      </Tabs>
    </>
  );
}
