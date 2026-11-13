"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@assistflow/shared/api/client";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Textarea } from "@assistflow/shared/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Field, FormError, fieldErrors } from "@assistflow/shared/components/form";
import { ConfirmDialog } from "@assistflow/shared/components/confirm";
import { useToast } from "@assistflow/shared/ui/toast";
import { useOrg } from "@/lib/org-context";
import { ImageUpload } from "@/components/crud";

export default function OrgSettingsPage() {
  const { org, isOwner, refresh } = useOrg(); const toast = useToast(); const router = useRouter();
  const [f, setF] = React.useState({ name: org.name, description: org.description, website: org.website, phone: org.phone, email: org.email, address: { line1: org.address?.line1 ?? "", city: org.address?.city ?? "", country: org.address?.country ?? "" }, currency: org.currency, timezone: org.timezone });
  const [origins, setOrigins] = React.useState(org.allowedOrigins.join("\n"));
  const [busy, setBusy] = React.useState(false); const [err, setErr] = React.useState<string | null>(null); const [errors, setErrors] = React.useState<Record<string, string>>({}); const [del, setDel] = React.useState(false); const [rotate, setRotate] = React.useState(false);
  async function save(body: Record<string, unknown>) { setBusy(true); setErr(null); try { await api.patch(`/v1/orgs/${org.uuid}`, body); toast.success("Saved"); await refresh(); } catch (e) { if (e instanceof ApiError) { setErr(e.message); setErrors(fieldErrors(e.details)); } } finally { setBusy(false); } }
  return (
    <>
      <PageHeader title="Organization settings" description={`UUID ${org.uuid}`} />
      <FormError message={err} />
      <Card><CardHeader><CardTitle>Profile</CardTitle><CardDescription>Shown to your customers in the chatbot and to the platform admin.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div><p className="mb-1 text-sm font-medium">Logo</p><ImageUpload url={org.logoUrl} label="Upload logo" onUpload={async (file) => { await api.upload(`/v1/orgs/${org.uuid}/logo`, file); await refresh(); toast.success("Logo updated"); }} /></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Business name" error={errors.name}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field><Field label="Website" error={errors.website}><Input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="https://" /></Field><Field label="Phone" error={errors.phone}><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field><Field label="Email" error={errors.email}><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field><Field label="Address"><Input value={f.address.line1} onChange={(e) => setF({ ...f, address: { ...f.address, line1: e.target.value } })} /></Field><Field label="City"><Input value={f.address.city} onChange={(e) => setF({ ...f, address: { ...f.address, city: e.target.value } })} /></Field><Field label="Country"><Input value={f.address.country} onChange={(e) => setF({ ...f, address: { ...f.address, country: e.target.value } })} /></Field><Field label="Currency" hint="Used for prices"><Input value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value.toUpperCase() })} /></Field></div>
          <Field label="Description" error={errors.description}><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="What you do, in a sentence or two. The chatbot uses this to introduce you." /></Field>
          <div className="flex justify-end"><Button onClick={() => save(f)} disabled={busy}>Save profile</Button></div>
        </CardContent></Card>
      <Card><CardHeader><CardTitle>Website widget security</CardTitle><CardDescription>Only these website origins may load your chatbot. Leave empty during testing (localhost works without it).</CardDescription></CardHeader>
        <CardContent className="space-y-3"><Field label="Allowed origins" hint="one per line, e.g. https://www.kababjees.com" error={errors.allowedOrigins}><Textarea value={origins} onChange={(e) => setOrigins(e.target.value)} disabled={!isOwner} /></Field>
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Widget key: <span className="font-mono">{org.widgetKey}</span></p><div className="flex gap-2">{isOwner ? <Button variant="outline" size="sm" onClick={() => setRotate(true)}>Rotate key</Button> : null}<Button size="sm" disabled={!isOwner || busy} onClick={() => save({ allowedOrigins: origins.split(/\n/).map((s) => s.trim()).filter(Boolean) })}>Save origins</Button></div></div>
          {!isOwner ? <p className="text-xs text-muted-foreground">Only the owner can change these.</p> : null}</CardContent></Card>
      {isOwner ? <Card className="border-destructive/30"><CardHeader><CardTitle>Danger zone</CardTitle><CardDescription>Deleting disables the chatbot immediately. Data is retained for 30 days.</CardDescription></CardHeader><CardContent><Button variant="destructive" onClick={() => setDel(true)}>Delete organization</Button></CardContent></Card> : null}
      <ConfirmDialog open={rotate} onOpenChange={setRotate} title="Rotate the widget key?" description="The old key stops working. You must update the script tag on your website." confirmLabel="Rotate" onConfirm={async () => { await api.post(`/v1/orgs/${org.uuid}/rotate-widget-key`); await refresh(); toast.success("Key rotated. Update your website snippet."); }} />
      <ConfirmDialog open={del} onOpenChange={setDel} title={`Delete ${org.name}?`} description="Members lose access and the chatbot stops answering." destructive confirmLabel="Delete organization" typeToConfirm={org.name} onConfirm={async () => { await api.delete(`/v1/orgs/${org.uuid}`, { confirmName: org.name }); router.replace("/organizations"); }} />
    </>
  );
}
