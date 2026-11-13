"use client";
import * as React from "react";
import { Dialog, DialogContent } from "@assistflow/shared/ui/dialog";
import { Button } from "@assistflow/shared/ui/button";
import { FormError, fieldErrors } from "@assistflow/shared/components/form";
import { ApiError } from "@assistflow/shared/api/client";

// Generic create/edit dialog wrapper that handles busy state and API validation errors.
export function FormDialog({ open, onOpenChange, title, description, size, onSubmit, children, submitLabel = "Save" }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; size?: "sm" | "md" | "lg"; onSubmit: () => Promise<void>; children: (errors: Record<string, string>) => React.ReactNode; submitLabel?: string }) {
  const [busy, setBusy] = React.useState(false); const [err, setErr] = React.useState<string | null>(null); const [errors, setErrors] = React.useState<Record<string, string>>({});
  React.useEffect(() => { if (open) { setErr(null); setErrors({}); } }, [open]);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setErr(null); setErrors({}); try { await onSubmit(); onOpenChange(false); } catch (ex) { if (ex instanceof ApiError) { setErr(ex.message); setErrors(fieldErrors(ex.details)); } else setErr((ex as Error).message); } finally { setBusy(false); } }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent title={title} description={description} size={size}>
      <form onSubmit={submit} className="space-y-4"><div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1"><FormError message={err} />{children(errors)}</div><div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : submitLabel}</Button></div></form>
    </DialogContent></Dialog>
  );
}
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export function HoursEditor({ value, onChange }: { value: { day: number; open: string; close: string; closed: boolean }[]; onChange: (v: { day: number; open: string; close: string; closed: boolean }[]) => void }) {
  const rows = DAYS.map((_, d) => value.find((h) => h.day === d) ?? { day: d, open: "09:00", close: "18:00", closed: false });
  const set = (d: number, patch: Partial<(typeof rows)[number]>) => onChange(rows.map((r) => (r.day === d ? { ...r, ...patch } : r)));
  return <div className="space-y-1.5">{rows.map((r) => <div key={r.day} className="flex items-center gap-2 text-sm"><span className="w-24">{DAYS[r.day].slice(0, 3)}</span><input type="checkbox" className="accent-[var(--brand)]" checked={!r.closed} onChange={(e) => set(r.day, { closed: !e.target.checked })} /><input type="time" className="h-8 rounded-md border px-2 text-sm disabled:opacity-40" disabled={r.closed} value={r.open} onChange={(e) => set(r.day, { open: e.target.value })} /><span className="text-muted-foreground">to</span><input type="time" className="h-8 rounded-md border px-2 text-sm disabled:opacity-40" disabled={r.closed} value={r.close} onChange={(e) => set(r.day, { close: e.target.value })} />{r.closed ? <span className="text-xs text-muted-foreground">closed</span> : null}</div>)}</div>;
}
export function AvailabilityEditor({ value, onChange }: { value: { day: number; start: string; end: string }[]; onChange: (v: { day: number; start: string; end: string }[]) => void }) {
  return <div className="space-y-1.5">{value.map((a, i) => <div key={i} className="flex items-center gap-2 text-sm"><select className="h-8 rounded-md border px-2 text-sm" value={a.day} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, day: Number(e.target.value) } : x)))}>{DAYS.map((d, k) => <option key={k} value={k}>{d.slice(0, 3)}</option>)}</select><input type="time" className="h-8 rounded-md border px-2 text-sm" value={a.start} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} /><span className="text-muted-foreground">to</span><input type="time" className="h-8 rounded-md border px-2 text-sm" value={a.end} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} /><button type="button" className="text-xs text-destructive" onClick={() => onChange(value.filter((_, j) => j !== i))}>Remove</button></div>)}<Button type="button" size="sm" variant="outline" onClick={() => onChange([...value, { day: 1, start: "09:00", end: "17:00" }])}>Add slot</Button></div>;
}
export function ImageUpload({ url, onUpload, label = "Upload image" }: { url?: string; onUpload: (f: File) => Promise<void>; label?: string }) {
  const ref = React.useRef<HTMLInputElement>(null); const [busy, setBusy] = React.useState(false);
  return <div className="flex items-center gap-3">{url ? <img src={url} alt="" className="size-14 rounded-lg border object-cover" /> : <div className="flex size-14 items-center justify-center rounded-lg border border-dashed text-[10px] text-muted-foreground">No image</div>}<input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setBusy(true); try { await onUpload(f); } finally { setBusy(false); e.target.value = ""; } }} /><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => ref.current?.click()}>{busy ? "Uploading…" : label}</Button></div>;
}
