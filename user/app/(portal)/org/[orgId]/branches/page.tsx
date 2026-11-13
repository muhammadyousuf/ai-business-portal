"use client";
import * as React from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useApi } from "@assistflow/shared/api/hooks";
import { api } from "@assistflow/shared/api/client";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Card, CardContent } from "@assistflow/shared/ui/card";
import { Field } from "@assistflow/shared/components/form";
import { Switch } from "@assistflow/shared/ui/switch";
import { ConfirmDialog } from "@assistflow/shared/components/confirm";
import { EmptyState, Loading } from "@assistflow/shared/components/states";
import { Pill } from "@assistflow/shared/components/pill";
import { useToast } from "@assistflow/shared/ui/toast";
import { useOrg } from "@/lib/org-context";
import { FormDialog, HoursEditor, DAYS } from "@/components/crud";

interface Branch { id: string; name: string; address: Record<string, string>; phone: string; email: string; hours: { day: number; open: string; close: string; closed: boolean }[]; isMain: boolean; isActive: boolean; deliveryAreas: string[]; deliveryCharge: number }
const blank = { name: "", address: { line1: "", city: "", country: "Pakistan" }, phone: "", email: "", hours: [] as Branch["hours"], isMain: false, isActive: true, deliveryAreas: "", deliveryCharge: 0 };

export default function BranchesPage() {
  const { org, has } = useOrg(); const toast = useToast();
  const { data, loading, refetch } = useApi<{ items: Branch[] }>(`/v1/orgs/${org.uuid}/branches`);
  const [open, setOpen] = React.useState(false); const [editing, setEditing] = React.useState<Branch | null>(null); const [f, setF] = React.useState(blank); const [del, setDel] = React.useState<Branch | null>(null);
  function openNew() { setEditing(null); setF(blank); setOpen(true); }
  function openEdit(b: Branch) { setEditing(b); setF({ name: b.name, address: { line1: b.address?.line1 ?? "", city: b.address?.city ?? "", country: b.address?.country ?? "" }, phone: b.phone, email: b.email, hours: b.hours, isMain: b.isMain, isActive: b.isActive, deliveryAreas: b.deliveryAreas.join(", "), deliveryCharge: b.deliveryCharge }); setOpen(true); }
  async function save() { const body = { ...f, deliveryAreas: f.deliveryAreas.split(",").map((s) => s.trim()).filter(Boolean) }; if (editing) await api.patch(`/v1/orgs/${org.uuid}/branches/${editing.id}`, body); else await api.post(`/v1/orgs/${org.uuid}/branches`, body); toast.success(editing ? "Branch updated" : "Branch added"); await refetch(); }
  return (
    <>
      <PageHeader title="Branches" description="Locations, contact details and opening hours. The chatbot answers 'where are you' and 'timings' from here." actions={<Button size="sm" onClick={openNew}><Plus /> Add branch</Button>} />
      {loading && !data ? <Loading /> : !data?.items.length ? <EmptyState icon={MapPin} title="No branches yet" action={<Button onClick={openNew}><Plus /> Add branch</Button>} /> : (
        <div className="grid gap-4 md:grid-cols-2">{data.items.map((b) => (
          <Card key={b.id}><CardContent className="p-4">
            <div className="flex items-start justify-between gap-2"><div><p className="font-medium">{b.name} {b.isMain ? <Pill tone="brand" className="ml-1">Main</Pill> : null} {!b.isActive ? <Pill className="ml-1">Inactive</Pill> : null}</p><p className="text-sm text-muted-foreground">{[b.address?.line1, b.address?.city, b.address?.country].filter(Boolean).join(", ") || "No address"}</p><p className="text-sm text-muted-foreground">{b.phone || "No phone"}{b.email ? ` · ${b.email}` : ""}</p></div><div className="flex gap-1"><Button variant="ghost" size="icon-sm" onClick={() => openEdit(b)} aria-label="Edit"><Pencil /></Button><Button variant="ghost" size="icon-sm" onClick={() => setDel(b)} aria-label="Delete"><Trash2 /></Button></div></div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-[10px]">{DAYS.map((d, i) => { const h = b.hours.find((x) => x.day === i); return <div key={d} className="rounded bg-muted p-1 text-center"><p className="font-medium">{d.slice(0, 3)}</p><p className="text-muted-foreground">{!h ? "—" : h.closed ? "closed" : `${h.open}–${h.close}`}</p></div>; })}</div>
            {has("orders") ? <p className="mt-2 text-xs text-muted-foreground">Delivery: {b.deliveryAreas.length ? b.deliveryAreas.join(", ") : "not configured"} · charge Rs. {b.deliveryCharge}</p> : null}
          </CardContent></Card>))}</div>
      )}
      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Edit branch" : "Add branch"} size="lg" onSubmit={save}>{(errors) => (<>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Branch name" error={errors.name} required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field><Field label="Phone" error={errors.phone}><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field><Field label="Address" error={errors.address}><Input value={f.address.line1} onChange={(e) => setF({ ...f, address: { ...f.address, line1: e.target.value } })} /></Field><Field label="City"><Input value={f.address.city} onChange={(e) => setF({ ...f, address: { ...f.address, city: e.target.value } })} /></Field><Field label="Country"><Input value={f.address.country} onChange={(e) => setF({ ...f, address: { ...f.address, country: e.target.value } })} /></Field><Field label="Email" error={errors.email}><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field></div>
        <div><p className="mb-2 text-sm font-medium">Opening hours</p><HoursEditor value={f.hours} onChange={(hours) => setF({ ...f, hours })} /></div>
        {has("orders") ? <div className="grid gap-4 sm:grid-cols-2"><Field label="Delivery areas" hint="comma separated, used by the chatbot"><Input value={f.deliveryAreas} onChange={(e) => setF({ ...f, deliveryAreas: e.target.value })} placeholder="DHA, Clifton, Gulshan" /></Field><Field label="Delivery charge"><Input type="number" min={0} value={f.deliveryCharge} onChange={(e) => setF({ ...f, deliveryCharge: Number(e.target.value) })} /></Field></div> : null}
        <div className="flex gap-6"><label className="flex items-center gap-2 text-sm"><Switch checked={f.isMain} onCheckedChange={(v) => setF({ ...f, isMain: v })} /> Main branch</label><label className="flex items-center gap-2 text-sm"><Switch checked={f.isActive} onCheckedChange={(v) => setF({ ...f, isActive: v })} /> Active</label></div>
      </>)}</FormDialog>
      <ConfirmDialog open={!!del} onOpenChange={() => setDel(null)} title={`Delete ${del?.name}?`} description="This cannot be undone." destructive confirmLabel="Delete" onConfirm={async () => { try { await api.delete(`/v1/orgs/${org.uuid}/branches/${del!.id}`); toast.success("Branch deleted"); await refetch(); } catch (e) { toast.error("Could not delete", (e as Error).message); } }} />
    </>
  );
}
