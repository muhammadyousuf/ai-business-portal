"use client";
import * as React from "react";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { useApi } from "@assistflow/shared/api/hooks";
import { api } from "@assistflow/shared/api/client";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Textarea } from "@assistflow/shared/ui/textarea";
import { Switch } from "@assistflow/shared/ui/switch";
import { Card, CardContent } from "@assistflow/shared/ui/card";
import { Field } from "@assistflow/shared/components/form";
import { ConfirmDialog } from "@assistflow/shared/components/confirm";
import { EmptyState, Loading } from "@assistflow/shared/components/states";
import { Pill } from "@assistflow/shared/components/pill";
import { UserAvatar } from "@assistflow/shared/components/user-avatar";
import { useToast } from "@assistflow/shared/ui/toast";
import { useOrg } from "@/lib/org-context";
import { FormDialog, AvailabilityEditor, ImageUpload, DAYS } from "@/components/crud";
import { money } from "@/components/common";

interface Staff { id: string; name: string; title: string; specialty: string; bio: string; photoUrl: string; fee: number; email: string; phone: string; availability: { day: number; start: string; end: string }[]; slotMinutes: number; isActive: boolean }
const blank = { name: "", title: "", specialty: "", bio: "", fee: 0, email: "", phone: "", availability: [] as Staff["availability"], slotMinutes: 30, isActive: true };

export default function StaffPage() {
  const { org, label } = useOrg(); const toast = useToast(); const S = label("staff", "Staff");
  const { data, loading, refetch } = useApi<{ items: Staff[] }>(`/v1/orgs/${org.uuid}/staff`);
  const [open, setOpen] = React.useState(false); const [editing, setEditing] = React.useState<Staff | null>(null); const [f, setF] = React.useState(blank); const [del, setDel] = React.useState<Staff | null>(null);
  const openForm = (s?: Staff) => { setEditing(s ?? null); setF(s ? { name: s.name, title: s.title, specialty: s.specialty, bio: s.bio, fee: s.fee, email: s.email, phone: s.phone, availability: s.availability, slotMinutes: s.slotMinutes, isActive: s.isActive } : blank); setOpen(true); };
  async function save() { if (editing) await api.patch(`/v1/orgs/${org.uuid}/staff/${editing.id}`, f); else await api.post(`/v1/orgs/${org.uuid}/staff`, f); toast.success(`${S} saved`); await refetch(); }
  return (
    <>
      <PageHeader title={S} description={`Profiles, fees and availability. The chatbot lists ${S.toLowerCase()} and takes ${label("appointment", "appointment").toLowerCase()} requests for them.`} actions={<Button size="sm" onClick={() => openForm()}><Plus /> Add {S.toLowerCase()}</Button>} />
      {loading && !data ? <Loading /> : !data?.items.length ? <EmptyState icon={UserRound} title={`No ${S.toLowerCase()} yet`} action={<Button onClick={() => openForm()}><Plus /> Add {S.toLowerCase()}</Button>} /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.items.map((s) => (
          <Card key={s.id}><CardContent className="p-4">
            <div className="flex items-start gap-3">{s.photoUrl ? <img src={s.photoUrl} alt="" className="size-12 rounded-full object-cover" /> : <UserAvatar name={s.name} className="size-12 [&_span]:text-sm" />}<div className="min-w-0 flex-1"><p className="font-medium">{s.name}{!s.isActive ? <Pill className="ml-2">Inactive</Pill> : null}</p><p className="text-sm text-muted-foreground">{[s.title, s.specialty].filter(Boolean).join(" · ") || "—"}</p>{s.fee ? <p className="text-sm">Fee {money(s.fee, org.currency)}</p> : null}</div><div className="flex gap-1"><Button variant="ghost" size="icon-sm" onClick={() => openForm(s)} aria-label="Edit"><Pencil /></Button><Button variant="ghost" size="icon-sm" onClick={() => setDel(s)} aria-label="Delete"><Trash2 /></Button></div></div>
            <p className="mt-3 text-xs text-muted-foreground">{s.availability.length ? s.availability.map((a) => `${DAYS[a.day].slice(0, 3)} ${a.start}–${a.end}`).join(" · ") : "No availability set"}</p>
          </CardContent></Card>))}</div>
      )}
      <FormDialog open={open} onOpenChange={setOpen} title={editing ? `Edit ${S.toLowerCase()}` : `Add ${S.toLowerCase()}`} size="lg" onSubmit={save}>{(errors) => (<>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Name" error={errors.name} required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field><Field label="Title" error={errors.title}><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Dentist" /></Field><Field label="Specialty"><Input value={f.specialty} onChange={(e) => setF({ ...f, specialty: e.target.value })} /></Field><Field label={`Fee (${org.currency})`} error={errors.fee}><Input type="number" min={0} value={f.fee} onChange={(e) => setF({ ...f, fee: Number(e.target.value) })} /></Field><Field label="Email" error={errors.email}><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field><Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field></div>
        <Field label="Bio"><Textarea value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></Field>
        <div><p className="mb-2 text-sm font-medium">Availability</p><AvailabilityEditor value={f.availability} onChange={(availability) => setF({ ...f, availability })} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Slot length (minutes)"><Input type="number" min={5} value={f.slotMinutes} onChange={(e) => setF({ ...f, slotMinutes: Number(e.target.value) })} /></Field><label className="flex items-center gap-2 pt-6 text-sm"><Switch checked={f.isActive} onCheckedChange={(v) => setF({ ...f, isActive: v })} /> Active</label></div>
        {editing ? <div><p className="mb-1 text-sm font-medium">Photo</p><ImageUpload url={editing.photoUrl} label="Upload photo" onUpload={async (file) => { const r = await api.upload<{ staff: Staff }>(`/v1/orgs/${org.uuid}/staff/${editing.id}/photo`, file); setEditing(r.staff); await refetch(); toast.success("Photo uploaded"); }} /></div> : null}
      </>)}</FormDialog>
      <ConfirmDialog open={!!del} onOpenChange={() => setDel(null)} title={`Remove ${del?.name}?`} destructive confirmLabel="Remove" onConfirm={async () => { await api.delete(`/v1/orgs/${org.uuid}/staff/${del!.id}`); toast.success("Removed"); await refetch(); }} />
    </>
  );
}
