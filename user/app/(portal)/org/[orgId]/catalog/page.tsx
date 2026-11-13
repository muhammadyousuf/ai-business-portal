"use client";
import * as React from "react";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useApi } from "@assistflow/shared/api/hooks";
import { api } from "@assistflow/shared/api/client";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Textarea } from "@assistflow/shared/ui/textarea";
import { Select } from "@assistflow/shared/ui/select";
import { Switch } from "@assistflow/shared/ui/switch";
import { Field } from "@assistflow/shared/components/form";
import { ConfirmDialog } from "@assistflow/shared/components/confirm";
import { EmptyState, Loading } from "@assistflow/shared/components/states";
import { Pill } from "@assistflow/shared/components/pill";
import { useToast } from "@assistflow/shared/ui/toast";
import { useOrg } from "@/lib/org-context";
import { FormDialog, ImageUpload } from "@/components/crud";
import { money } from "@/components/common";

interface Group { id: string; name: string; description: string; sortOrder: number; isActive: boolean }
interface Item { id: string; groupId: string; name: string; description: string; price: number; currency: string; imageUrl: string; tags: string[]; isAvailable: boolean; durationMinutes?: number }

export default function CatalogPage() {
  const { org, label, has } = useOrg(); const toast = useToast();
  const G = label("catalogGroup", "Group"); const I = label("catalogItem", "Item");
  const groups = useApi<{ items: Group[] }>(`/v1/orgs/${org.uuid}/catalog/groups`); const items = useApi<{ items: Item[] }>(`/v1/orgs/${org.uuid}/catalog/items`);
  const [gOpen, setGOpen] = React.useState(false); const [gEdit, setGEdit] = React.useState<Group | null>(null); const [gf, setGf] = React.useState({ name: "", description: "" });
  const [iOpen, setIOpen] = React.useState(false); const [iEdit, setIEdit] = React.useState<Item | null>(null); const [iff, setIf] = React.useState({ groupId: "", name: "", description: "", price: 0, tags: "", isAvailable: true, durationMinutes: "" });
  const [del, setDel] = React.useState<{ kind: "group" | "item"; id: string; name: string } | null>(null);
  const refresh = async () => { await Promise.all([groups.refetch(), items.refetch()]); };
  const openGroup = (g?: Group) => { setGEdit(g ?? null); setGf({ name: g?.name ?? "", description: g?.description ?? "" }); setGOpen(true); };
  const openItem = (it?: Item, groupId?: string) => { setIEdit(it ?? null); setIf({ groupId: it?.groupId ?? groupId ?? groups.data?.items[0]?.id ?? "", name: it?.name ?? "", description: it?.description ?? "", price: it?.price ?? 0, tags: it?.tags.join(", ") ?? "", isAvailable: it?.isAvailable ?? true, durationMinutes: it?.durationMinutes ? String(it.durationMinutes) : "" }); setIOpen(true); };
  async function saveGroup() { if (gEdit) await api.patch(`/v1/orgs/${org.uuid}/catalog/groups/${gEdit.id}`, gf); else await api.post(`/v1/orgs/${org.uuid}/catalog/groups`, gf); toast.success(`${G} saved`); await refresh(); }
  async function saveItem() { const body = { ...iff, price: Number(iff.price), tags: iff.tags.split(",").map((s) => s.trim()).filter(Boolean), durationMinutes: iff.durationMinutes ? Number(iff.durationMinutes) : undefined }; if (iEdit) await api.patch(`/v1/orgs/${org.uuid}/catalog/items/${iEdit.id}`, body); else await api.post(`/v1/orgs/${org.uuid}/catalog/items`, body); toast.success(`${I} saved`); await refresh(); }
  const loading = (groups.loading && !groups.data) || (items.loading && !items.data);
  return (
    <>
      <PageHeader title={`${G}s & ${I.toLowerCase()}s`} description={`The chatbot quotes names and prices from here. ${has("orders") ? "Customers can order these items." : has("appointments") ? "Customers can book these." : ""}`} actions={<><Button size="sm" variant="outline" onClick={() => openGroup()}><Plus /> {G}</Button><Button size="sm" onClick={() => openItem()} disabled={!groups.data?.items.length}><Plus /> {I}</Button></>} />
      {loading ? <Loading /> : !groups.data?.items.length ? <EmptyState icon={Package} title={`No ${G.toLowerCase()}s yet`} description={`Create a ${G.toLowerCase()} first, then add ${I.toLowerCase()}s with prices.`} action={<Button onClick={() => openGroup()}><Plus /> Add {G.toLowerCase()}</Button>} /> : (
        <div className="space-y-4">{groups.data.items.map((g) => { const its = items.data?.items.filter((i) => i.groupId === g.id) ?? []; return (
          <div key={g.id} className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex items-center justify-between border-b px-4 py-2.5"><div><p className="text-sm font-semibold">{g.name}{!g.isActive ? <Pill className="ml-2">Hidden</Pill> : null}</p>{g.description ? <p className="text-xs text-muted-foreground">{g.description}</p> : null}</div><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => openItem(undefined, g.id)}><Plus /> {I}</Button><Button variant="ghost" size="icon-sm" onClick={() => openGroup(g)} aria-label="Edit group"><Pencil /></Button><Button variant="ghost" size="icon-sm" onClick={() => setDel({ kind: "group", id: g.id, name: g.name })} aria-label="Delete group"><Trash2 /></Button></div></div>
            {its.length ? <ul className="divide-y">{its.map((it) => <li key={it.id} className="flex items-center gap-3 px-4 py-2.5">{it.imageUrl ? <img src={it.imageUrl} alt="" className="size-10 rounded-md object-cover" /> : <div className="size-10 rounded-md bg-muted" />}<div className="min-w-0 flex-1"><p className="text-sm font-medium">{it.name}{!it.isAvailable ? <Pill className="ml-2">Unavailable</Pill> : null}</p><p className="truncate text-xs text-muted-foreground">{it.description || it.tags.join(", ")}</p></div><span className="tabular text-sm font-medium">{money(it.price, it.currency)}</span><Button variant="ghost" size="icon-sm" onClick={() => openItem(it)} aria-label="Edit"><Pencil /></Button><Button variant="ghost" size="icon-sm" onClick={() => setDel({ kind: "item", id: it.id, name: it.name })} aria-label="Delete"><Trash2 /></Button></li>)}</ul> : <p className="px-4 py-4 text-xs text-muted-foreground">No {I.toLowerCase()}s in this {G.toLowerCase()} yet.</p>}
          </div>); })}</div>
      )}
      <FormDialog open={gOpen} onOpenChange={setGOpen} title={gEdit ? `Edit ${G.toLowerCase()}` : `New ${G.toLowerCase()}`} onSubmit={saveGroup}>{(errors) => <><Field label="Name" error={errors.name} required><Input value={gf.name} onChange={(e) => setGf({ ...gf, name: e.target.value })} required /></Field><Field label="Description" error={errors.description}><Textarea value={gf.description} onChange={(e) => setGf({ ...gf, description: e.target.value })} /></Field></>}</FormDialog>
      <FormDialog open={iOpen} onOpenChange={setIOpen} title={iEdit ? `Edit ${I.toLowerCase()}` : `New ${I.toLowerCase()}`} size="lg" onSubmit={saveItem}>{(errors) => (<>
        <div className="grid gap-4 sm:grid-cols-2"><Field label={G} error={errors.groupId} required><Select value={iff.groupId} onChange={(e) => setIf({ ...iff, groupId: e.target.value })}>{groups.data?.items.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select></Field><Field label="Name" error={errors.name} required><Input value={iff.name} onChange={(e) => setIf({ ...iff, name: e.target.value })} required /></Field><Field label={`Price (${org.currency})`} error={errors.price} required><Input type="number" min={0} step="0.01" value={iff.price} onChange={(e) => setIf({ ...iff, price: Number(e.target.value) })} required /></Field><Field label="Tags" hint="comma separated"><Input value={iff.tags} onChange={(e) => setIf({ ...iff, tags: e.target.value })} /></Field>{has("appointments") ? <Field label="Duration (minutes)"><Input type="number" min={0} value={iff.durationMinutes} onChange={(e) => setIf({ ...iff, durationMinutes: e.target.value })} /></Field> : null}</div>
        <Field label="Description" error={errors.description}><Textarea value={iff.description} onChange={(e) => setIf({ ...iff, description: e.target.value })} /></Field>
        {iEdit ? <div><p className="mb-1 text-sm font-medium">Image</p><ImageUpload url={iEdit.imageUrl} onUpload={async (file) => { const r = await api.upload<{ item: Item }>(`/v1/orgs/${org.uuid}/catalog/items/${iEdit.id}/image`, file); setIEdit(r.item); await items.refetch(); toast.success("Image uploaded"); }} /></div> : <p className="text-xs text-muted-foreground">Save first, then add an image.</p>}
        <label className="flex items-center gap-2 text-sm"><Switch checked={iff.isAvailable} onCheckedChange={(v) => setIf({ ...iff, isAvailable: v })} /> Available</label>
      </>)}</FormDialog>
      <ConfirmDialog open={!!del} onOpenChange={() => setDel(null)} title={`Delete ${del?.name}?`} destructive confirmLabel="Delete" onConfirm={async () => { try { await api.delete(`/v1/orgs/${org.uuid}/catalog/${del!.kind === "group" ? "groups" : "items"}/${del!.id}`); toast.success("Deleted"); await refresh(); } catch (e) { toast.error("Could not delete", (e as Error).message); } }} />
    </>
  );
}
