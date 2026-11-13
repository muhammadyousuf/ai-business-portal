"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Copy, ExternalLink, MessageCircleQuestion, Pencil, Plus, Trash2 } from "lucide-react";
import { useApi } from "@assistflow/shared/api/hooks";
import { api, ApiError } from "@assistflow/shared/api/client";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Textarea } from "@assistflow/shared/ui/textarea";
import { Select } from "@assistflow/shared/ui/select";
import { Switch } from "@assistflow/shared/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@assistflow/shared/ui/tabs";
import { Field, FormError, fieldErrors } from "@assistflow/shared/components/form";
import { ConfirmDialog } from "@assistflow/shared/components/confirm";
import { EmptyState, Loading } from "@assistflow/shared/components/states";
import { Pill } from "@assistflow/shared/components/pill";
import { useToast } from "@assistflow/shared/ui/toast";
import { useOrg } from "@/lib/org-context";
import { FormDialog } from "@/components/crud";

interface Qa { id: string; question: string; answer: string; keywords: string[]; isActive: boolean; hits: number }
interface Config { name: string; greeting: string; fallbackMessage: string; collectContact: boolean; brandColor: string; position: string; buttonLabel: string; quickReplies: string[]; handoverKeywords: string[]; isEnabled: boolean }

export default function ChatbotPage() {
  const params = useSearchParams();
  return <React.Suspense><ChatbotInner initialTab={params.get("tab") ?? "qa"} /></React.Suspense>;
}
function ChatbotInner({ initialTab }: { initialTab: string }) {
  const { org } = useOrg(); const toast = useToast();
  const qas = useApi<{ items: Qa[] }>(`/v1/orgs/${org.uuid}/chatbot/qas`); const cfg = useApi<{ config: Config }>(`/v1/orgs/${org.uuid}/chatbot`); const embed = useApi<{ snippet: string; widgetKey: string; playgroundUrl: string; apiUrl: string }>(`/v1/orgs/${org.uuid}/chatbot/embed`); const unanswered = useApi<{ items: { id: string; question: string; count: number }[] }>(`/v1/orgs/${org.uuid}/chatbot/unanswered`);
  const [open, setOpen] = React.useState(false); const [editing, setEditing] = React.useState<Qa | null>(null); const [f, setF] = React.useState({ question: "", answer: "", keywords: "", isActive: true }); const [del, setDel] = React.useState<Qa | null>(null); const [q, setQ] = React.useState("");
  const openForm = (qa?: Qa, prefillQuestion?: string) => { setEditing(qa ?? null); setF({ question: qa?.question ?? prefillQuestion ?? "", answer: qa?.answer ?? "", keywords: qa?.keywords.join(", ") ?? "", isActive: qa?.isActive ?? true }); setOpen(true); };
  async function saveQa() { const body = { ...f, keywords: f.keywords.split(",").map((s) => s.trim()).filter(Boolean) }; if (editing) await api.patch(`/v1/orgs/${org.uuid}/chatbot/qas/${editing.id}`, body); else await api.post(`/v1/orgs/${org.uuid}/chatbot/qas`, body); toast.success("Saved"); await Promise.all([qas.refetch(), unanswered.refetch()]); }
  const filtered = qas.data?.items.filter((x) => !q || x.question.toLowerCase().includes(q.toLowerCase()) || x.answer.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="Chatbot" description="What the assistant says, what it knows, and how to put it on your website." actions={<Button size="sm" onClick={() => openForm()}><Plus /> Add question</Button>} />
      <Tabs defaultValue={initialTab}>
        <TabsList><TabsTrigger value="qa">Questions & answers ({qas.data?.items.length ?? 0})</TabsTrigger><TabsTrigger value="settings">Assistant settings</TabsTrigger><TabsTrigger value="install">Install on website</TabsTrigger><TabsTrigger value="gaps">Unanswered ({unanswered.data?.items.length ?? 0})</TabsTrigger></TabsList>
        <TabsContent value="qa" className="space-y-3">
          <Input placeholder="Search questions…" className="h-8 w-64" value={q} onChange={(e) => setQ(e.target.value)} />
          {qas.loading && !qas.data ? <Loading /> : !filtered?.length ? <EmptyState icon={MessageCircleQuestion} title="No questions yet" description="Add the questions customers ask most: delivery, timings, prices, parking, policies." action={<Button onClick={() => openForm()}><Plus /> Add question</Button>} /> : (
            <div className="space-y-2">{filtered.map((x) => <Card key={x.id}><CardContent className="flex items-start gap-3 p-4"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{x.question}{!x.isActive ? <Pill className="ml-2">Off</Pill> : null}</p><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{x.answer}</p>{x.keywords.length ? <p className="mt-1 text-xs text-muted-foreground">Keywords: {x.keywords.join(", ")}</p> : null}</div><span className="text-xs tabular text-muted-foreground">{x.hits} uses</span><Button variant="ghost" size="icon-sm" onClick={() => openForm(x)} aria-label="Edit"><Pencil /></Button><Button variant="ghost" size="icon-sm" onClick={() => setDel(x)} aria-label="Delete"><Trash2 /></Button></CardContent></Card>)}</div>
          )}
        </TabsContent>
        <TabsContent value="settings">{cfg.data ? <ConfigForm config={cfg.data.config} orgId={org.uuid} onSaved={cfg.refetch} /> : <Loading />}</TabsContent>
        <TabsContent value="install">{embed.data ? <Card><CardHeader><CardTitle>Add the chatbot to your website</CardTitle><CardDescription>Paste this before the closing &lt;/body&gt; tag. Works on WordPress, Shopify, Wix, Webflow or any HTML site.</CardDescription></CardHeader><CardContent className="space-y-4">
          <pre className="overflow-x-auto rounded-lg bg-foreground p-3 text-xs text-background"><code>{embed.data.snippet}</code></pre>
          <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => { navigator.clipboard.writeText(embed.data!.snippet); toast.success("Snippet copied"); }}><Copy /> Copy snippet</Button><Button size="sm" variant="outline" asChild><a href={embed.data.playgroundUrl} target="_blank" rel="noreferrer"><ExternalLink /> Try it on a test page</a></Button></div>
          <div className="grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-md border p-3"><p className="font-medium">WordPress</p><p className="text-xs text-muted-foreground">Appearance → Theme File Editor → footer.php, or use the &quot;Insert Headers and Footers&quot; plugin (Footer box).</p></div><div className="rounded-md border p-3"><p className="font-medium">Shopify</p><p className="text-xs text-muted-foreground">Online Store → Themes → Edit code → theme.liquid, paste before &lt;/body&gt;.</p></div><div className="rounded-md border p-3"><p className="font-medium">Wix / Squarespace / Webflow</p><p className="text-xs text-muted-foreground">Settings → Custom code → Footer.</p></div><div className="rounded-md border p-3"><p className="font-medium">No website?</p><p className="text-xs text-muted-foreground">Share the test page link above on WhatsApp or social media; it works as a hosted chat page.</p></div></div>
          <p className="text-xs text-muted-foreground">For production, add your website address under Settings → Website widget security so only your site can load the chatbot.</p>
        </CardContent></Card> : <Loading />}</TabsContent>
        <TabsContent value="gaps">{!unanswered.data?.items.length ? <EmptyState title="No unanswered questions" description="When the assistant cannot answer something, it shows up here so you can add an answer." /> : <Card><CardContent className="divide-y p-0">{unanswered.data.items.map((u) => <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 text-sm"><span className="flex-1">{u.question}</span><span className="text-xs text-muted-foreground">asked {u.count}×</span><Button size="sm" variant="outline" onClick={() => openForm(undefined, u.question)}><Plus /> Add answer</Button><Button size="icon-sm" variant="ghost" aria-label="Dismiss" onClick={async () => { await api.delete(`/v1/orgs/${org.uuid}/chatbot/unanswered/${u.id}`); await unanswered.refetch(); }}><Trash2 /></Button></div>)}</CardContent></Card>}</TabsContent>
      </Tabs>
      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Edit question" : "Add question"} size="lg" onSubmit={saveQa}>{(errors) => (<><Field label="Question" hint="How a customer would ask it" error={errors.question} required><Input value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} required /></Field><Field label="Answer" error={errors.answer} required><Textarea value={f.answer} onChange={(e) => setF({ ...f, answer: e.target.value })} className="min-h-[120px]" required /></Field><Field label="Keywords" hint="comma separated words that should trigger this answer" error={errors.keywords}><Input value={f.keywords} onChange={(e) => setF({ ...f, keywords: e.target.value })} placeholder="deliver, delivery, home delivery" /></Field><label className="flex items-center gap-2 text-sm"><Switch checked={f.isActive} onCheckedChange={(v) => setF({ ...f, isActive: v })} /> Active</label></>)}</FormDialog>
      <ConfirmDialog open={!!del} onOpenChange={() => setDel(null)} title="Delete this question?" destructive confirmLabel="Delete" onConfirm={async () => { await api.delete(`/v1/orgs/${org.uuid}/chatbot/qas/${del!.id}`); toast.success("Deleted"); await qas.refetch(); }} />
    </>
  );
}
function ConfigForm({ config, orgId, onSaved }: { config: Config; orgId: string; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const [f, setF] = React.useState({ ...config, quickReplies: config.quickReplies.join("\n"), handoverKeywords: config.handoverKeywords.join(", ") });
  const [busy, setBusy] = React.useState(false); const [err, setErr] = React.useState<string | null>(null); const [errors, setErrors] = React.useState<Record<string, string>>({});
  async function save() { setBusy(true); setErr(null); try { await api.patch(`/v1/orgs/${orgId}/chatbot`, { ...f, quickReplies: f.quickReplies.split("\n").map((s) => s.trim()).filter(Boolean), handoverKeywords: f.handoverKeywords.split(",").map((s) => s.trim()).filter(Boolean) }); toast.success("Assistant settings saved"); await onSaved(); } catch (e) { if (e instanceof ApiError) { setErr(e.message); setErrors(fieldErrors(e.details)); } } finally { setBusy(false); } }
  return (
    <Card><CardHeader><CardTitle>Assistant settings</CardTitle><CardDescription>Personality, appearance and when to hand over to your team.</CardDescription></CardHeader>
      <CardContent className="space-y-4"><FormError message={err} />
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Assistant name" error={errors.name}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field><Field label="Button label" error={errors.buttonLabel}><Input value={f.buttonLabel} onChange={(e) => setF({ ...f, buttonLabel: e.target.value })} /></Field><Field label="Brand colour" error={errors.brandColor}><div className="flex items-center gap-2"><input type="color" value={f.brandColor} onChange={(e) => setF({ ...f, brandColor: e.target.value })} className="size-9 rounded border" /><Input value={f.brandColor} onChange={(e) => setF({ ...f, brandColor: e.target.value })} className="font-mono" /></div></Field><Field label="Position"><Select value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })}><option value="bottom-right">Bottom right</option><option value="bottom-left">Bottom left</option></Select></Field></div>
        <Field label="Greeting" error={errors.greeting}><Textarea value={f.greeting} onChange={(e) => setF({ ...f, greeting: e.target.value })} /></Field>
        <Field label="Fallback message" hint="Shown when the assistant cannot answer" error={errors.fallbackMessage}><Textarea value={f.fallbackMessage} onChange={(e) => setF({ ...f, fallbackMessage: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Quick replies" hint="one per line, shown as buttons (leave empty to use your top questions)" error={errors.quickReplies}><Textarea value={f.quickReplies} onChange={(e) => setF({ ...f, quickReplies: e.target.value })} /></Field><Field label="Hand over to a human when the customer says" hint="comma separated" error={errors.handoverKeywords}><Textarea value={f.handoverKeywords} onChange={(e) => setF({ ...f, handoverKeywords: e.target.value })} /></Field></div>
        <div className="flex flex-wrap gap-6"><label className="flex items-center gap-2 text-sm"><Switch checked={f.isEnabled} onCheckedChange={(v) => setF({ ...f, isEnabled: v })} /> Chatbot enabled</label><label className="flex items-center gap-2 text-sm"><Switch checked={f.collectContact} onCheckedChange={(v) => setF({ ...f, collectContact: v })} /> Ask for name and phone before orders / bookings</label></div>
        <div className="flex justify-end"><Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save settings"}</Button></div>
      </CardContent></Card>
  );
}
