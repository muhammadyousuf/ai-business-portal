import { Clock, FileText, MapPin, Plus, RefreshCw, Sparkles, Upload } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Input } from "@assistflow/shared/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@assistflow/shared/ui/tabs";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Pill } from "@assistflow/shared/components/pill";
import { deliveryZones, faqs, fmtPKR, hours, knowledgeDocs } from "@assistflow/shared/mock/business";
import { formatDate } from "@assistflow/shared/lib/utils";

export default function KnowledgePage() {
  return (
    <>
      <PageHeader title="Knowledge base" description="Everything the assistant is allowed to say. FAQs, delivery zones, opening hours and documents." actions={<Button size="sm"><Plus /> Add FAQ</Button>} />
      <Tabs defaultValue="faqs">
        <TabsList><TabsTrigger value="faqs">FAQs ({faqs.length})</TabsTrigger><TabsTrigger value="zones">Delivery zones</TabsTrigger><TabsTrigger value="hours">Opening hours</TabsTrigger><TabsTrigger value="docs">Documents ({knowledgeDocs.length})</TabsTrigger></TabsList>

        <TabsContent value="faqs" className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {faqs.map((f) => (
              <Card key={f.id}><CardContent className="p-4">
                <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium">{f.question}</p><div className="flex shrink-0 items-center gap-2">{f.source === "ai_suggested" ? <Pill tone="brand"><Sparkles className="size-3" /> AI suggested</Pill> : null}<span className="text-[11px] tabular text-muted-foreground">{f.hits30d} asks</span></div></div>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.answer}</p>
                <div className="mt-2 flex gap-2"><Button variant="ghost" size="sm">Edit</Button>{f.source === "ai_suggested" ? <Button size="sm" variant="outline">Approve answer</Button> : null}</div>
              </CardContent></Card>
            ))}
          </div>
          <Card className="h-fit"><CardHeader><CardTitle>Gaps the AI found</CardTitle><CardDescription>Questions it could not answer well this week.</CardDescription></CardHeader><CardContent className="space-y-2 text-sm">
            {["Do you have a vegetarian biryani?", "Can I pay by card at the door?", "Do you deliver to DHA for large orders?"].map((q) => <div key={q} className="flex items-center justify-between gap-2 rounded-md border p-2"><span className="text-xs">{q}</span><Button size="sm" variant="ghost">Answer</Button></div>)}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="zones" className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2"><CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle>Delivery zones</CardTitle><CardDescription>The assistant checks these before quoting delivery. Inactive zones get a polite no plus a pickup offer.</CardDescription></div><Button size="sm" variant="outline"><Plus /> Zone</Button></CardHeader>
            <CardContent className="divide-y">{deliveryZones.map((z) => <div key={z.id} className="flex items-center gap-3 py-2.5 text-sm"><MapPin className="size-4 text-muted-foreground" /><span className="flex-1 font-medium">{z.name}</span><Input defaultValue={z.charge} className="h-7 w-20 text-right tabular" /><span className="w-16 text-xs text-muted-foreground">{z.active ? `~${z.etaMins} min` : "inactive"}</span><Pill tone={z.active ? "success" : "neutral"}>{z.active ? "Active" : "Off"}</Pill></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Rules</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div><p className="text-xs text-muted-foreground">Minimum order</p><Input defaultValue="500" className="mt-1 h-8" /></div><div><p className="text-xs text-muted-foreground">Free delivery above</p><Input defaultValue="3000" className="mt-1 h-8" /></div><p className="text-xs text-muted-foreground">Delivery charges are shown as {fmtPKR(100)}–{fmtPKR(200)} on the website automatically.</p></CardContent></Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" /> Opening hours</CardTitle><CardDescription>Outside these hours the assistant still answers questions but tells customers when ordering reopens.</CardDescription></CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">{hours.map((h) => <div key={h.day} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"><span className="w-10 font-medium">{h.day}</span><Input defaultValue={h.open} className="h-7 w-20" /><span className="text-muted-foreground">to</span><Input defaultValue={h.close} className="h-7 w-20" /></div>)}</CardContent></Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card><CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle>Documents</CardTitle><CardDescription>PDF, DOCX or text. Chunked and embedded so the assistant can cite them.</CardDescription></div><Button size="sm"><Upload /> Upload</Button></CardHeader>
            <CardContent className="divide-y">{knowledgeDocs.map((d) => <div key={d.id} className="flex items-center gap-3 py-2.5 text-sm"><FileText className="size-4 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{d.name}</p><p className="text-xs text-muted-foreground">{d.size} · {d.chunks} chunks · {formatDate(d.uploadedAt)}</p></div>{d.status === "processing" ? <Pill tone="info"><RefreshCw className="size-3 animate-spin" /> Indexing</Pill> : <Pill tone="success">Indexed</Pill>}<Button variant="ghost" size="sm">Remove</Button></div>)}</CardContent></Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
