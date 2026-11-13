"use client";
import * as React from "react";
import { Plus, Pencil } from "lucide-react";
import { useApi } from "@assistflow/shared/api/hooks";
import { api, ApiError } from "@assistflow/shared/api/client";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Textarea } from "@assistflow/shared/ui/textarea";
import { Switch } from "@assistflow/shared/ui/switch";
import { Dialog, DialogContent } from "@assistflow/shared/ui/dialog";
import { Field, FormError, fieldErrors } from "@assistflow/shared/components/form";
import { useToast } from "@assistflow/shared/ui/toast";
import { DataTable, Pill } from "@/components/common";

interface Cat { id: string; key: string; name: string; description: string; icon: string; modules: string[]; labels: Record<string, string>; inquiryTypes: string[]; isActive: boolean; isSystem: boolean; sortOrder: number; organizationCount: number }
const MODULE_INFO: Record<string, string> = { branches: "Branches and locations", catalog: "Catalog: menus, services, plans, courses (with prices and images)", staff: "Staff profiles with availability (doctors, trainers, teachers)", qa: "Chatbot Q&A", inbox: "Conversation inbox", orders: "Orders (restaurant-style checkout)", appointments: "Appointment / booking requests", inquiries: "Inquiries (admissions, membership, general)" };
const empty = { key: "", name: "", description: "", icon: "store", modules: ["branches", "qa", "inbox"], labels: { catalogGroup: "Category", catalogItem: "Item", staff: "Staff", appointment: "Appointment", inquiry: "Inquiry" }, inquiryTypes: "general", isActive: true, sortOrder: 100 };

export default function CategoriesPage() {
  const toast = useToast();
  const { data, loading, error, refetch } = useApi<{ items: Cat[]; modules: string[] }>("/v1/admin/categories");
  const [open, setOpen] = React.useState(false); const [editing, setEditing] = React.useState<Cat | null>(null);
  const [form, setForm] = React.useState<typeof empty>(empty); const [errors, setErrors] = React.useState<Record<string, string>>({}); const [err, setErr] = React.useState<string | null>(null); const [busy, setBusy] = React.useState(false);
  function openNew() { setEditing(null); setForm(empty); setErrors({}); setErr(null); setOpen(true); }
  function openEdit(c: Cat) { setEditing(c); setForm({ key: c.key, name: c.name, description: c.description, icon: c.icon, modules: c.modules, labels: { ...empty.labels, ...c.labels }, inquiryTypes: c.inquiryTypes.join(", "), isActive: c.isActive, sortOrder: c.sortOrder }); setErrors({}); setErr(null); setOpen(true); }
  async function save() {
    setBusy(true); setErr(null); setErrors({});
    const body = { ...form, inquiryTypes: form.inquiryTypes.split(",").map((s) => s.trim()).filter(Boolean) };
    try { if (editing) { const { key, ...rest } = body; void key; await api.patch(`/v1/admin/categories/${editing.key}`, rest); } else await api.post("/v1/admin/categories", body); toast.success(editing ? "Category updated" : "Category created"); setOpen(false); await refetch(); }
    catch (e) { if (e instanceof ApiError) { setErr(e.message); setErrors(fieldErrors(e.details)); } else setErr("Something went wrong"); }
    finally { setBusy(false); }
  }
  const toggleModule = (m: string) => setForm((f) => ({ ...f, modules: f.modules.includes(m) ? f.modules.filter((x) => x !== m) : [...f.modules, m] }));
  return (
    <>
      <PageHeader title="Organization categories" description="Each category decides which modules and labels an organization gets. Add new categories here without code changes." actions={<Button size="sm" onClick={openNew}><Plus /> New category</Button>} />
      <DataTable rows={data?.items} loading={loading} error={error?.message} onRetry={refetch} empty={{ title: "No categories" }} cols={[
        { key: "n", label: "Category", render: (c) => <div><p className="font-medium">{c.name} <span className="font-mono text-[11px] text-muted-foreground">{c.key}</span></p><p className="text-xs text-muted-foreground">{c.description}</p></div> },
        { key: "m", label: "Modules", render: (c) => <span className="flex flex-wrap gap-1">{c.modules.map((m) => <Pill key={m}>{m}</Pill>)}</span> },
        { key: "l", label: "Labels", className: "text-xs text-muted-foreground hidden lg:table-cell", render: (c) => `${c.labels.catalogGroup} / ${c.labels.catalogItem} · ${c.labels.staff}` },
        { key: "o", label: "Orgs", className: "text-right tabular", render: (c) => c.organizationCount },
        { key: "a", label: "Visible", render: (c) => <Pill tone={c.isActive ? "success" : "neutral"}>{c.isActive ? "Active" : "Hidden"}</Pill> },
        { key: "e", label: "", className: "text-right", render: (c) => <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil /> Edit</Button> },
      ]} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={editing ? `Edit ${editing.name}` : "New category"} description="Modules decide what the organization can manage and what the chatbot can do." size="lg">
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <FormError message={err} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Key" hint="lowercase, letters/numbers/underscore" error={errors.key} required><Input value={form.key} disabled={!!editing} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="pharmacy" /></Field>
              <Field label="Name" error={errors.name} required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Pharmacy" /></Field>
            </div>
            <Field label="Description" error={errors.description}><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <div><p className="mb-2 text-sm font-medium">Modules</p><div className="grid gap-2 sm:grid-cols-2">{(data?.modules ?? Object.keys(MODULE_INFO)).map((m) => <label key={m} className="flex items-start gap-2 rounded-md border p-2 text-sm"><input type="checkbox" className="mt-1 accent-[var(--brand)]" checked={form.modules.includes(m)} onChange={() => toggleModule(m)} /><span><span className="font-medium">{m}</span><br /><span className="text-xs text-muted-foreground">{MODULE_INFO[m]}</span></span></label>)}</div>{errors.modules ? <p className="mt-1 text-xs text-destructive">{errors.modules}</p> : null}</div>
            <div><p className="mb-2 text-sm font-medium">Labels</p><div className="grid gap-3 sm:grid-cols-2">{(["catalogGroup", "catalogItem", "staff", "appointment", "inquiry"] as const).map((k) => <Field key={k} label={k}><Input value={form.labels[k]} onChange={(e) => setForm({ ...form, labels: { ...form.labels, [k]: e.target.value } })} /></Field>)}</div></div>
            <div className="grid gap-4 sm:grid-cols-3"><Field label="Inquiry types" hint="comma separated"><Input value={form.inquiryTypes} onChange={(e) => setForm({ ...form, inquiryTypes: e.target.value })} /></Field><Field label="Icon"><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></Field><Field label="Sort order"><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></Field></div>
            <label className="flex items-center justify-between rounded-md border p-3 text-sm"><span>Visible at signup</span><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /></label>
          </div>
          <div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button></div>
        </DialogContent>
      </Dialog>
    </>
  );
}
