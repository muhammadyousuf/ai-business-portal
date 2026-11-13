"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Bot, CheckCircle2, Hand, Phone, RotateCcw, SendHorizonal, UserRound } from "lucide-react";
import { useApi, usePolling } from "@assistflow/shared/api/hooks";
import { api } from "@assistflow/shared/api/client";
import { Button } from "@assistflow/shared/ui/button";
import { Textarea } from "@assistflow/shared/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { StatusBadge } from "@assistflow/shared/components/pill";
import { Loading } from "@assistflow/shared/components/states";
import { appointmentStatus, conversationStatus, inquiryStatus, orderStatus } from "@assistflow/shared/lib/status";
import { useToast } from "@assistflow/shared/ui/toast";
import { useOrg } from "@/lib/org-context";
import { InboxList } from "@/components/inbox-list";
import { MessageThread, type Msg } from "@/components/message-thread";
import { money } from "@/components/common";

interface Detail { conversation: { id: string; status: string; customer: { name: string; phone: string; email: string; address: string }; pageUrl: string; assignee: { id: string; name: string } | null; createdAt: string }; messages: Msg[]; orders: { id: string; number: number; status: string; total: number; currency: string }[]; appointments: { id: string; number: number; status: string; staffName: string; requestedText: string }[]; inquiries: { id: string; number: number; status: string; type: string }[] }

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>(); const { org, base, has } = useOrg(); const toast = useToast();
  const { data, loading, refetch, setData } = useApi<Detail>(`/v1/orgs/${org.uuid}/conversations/${id}`);
  usePolling(refetch, 4000);
  const [text, setText] = React.useState(""); const [busy, setBusy] = React.useState(false); const endRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [data?.messages.length]);
  const act = async (action: string) => { try { await api.post(`/v1/orgs/${org.uuid}/conversations/${id}/${action}`); await refetch(); } catch (e) { toast.error("Action failed", (e as Error).message); } };
  async function send() { const t = text.trim(); if (!t) return; setBusy(true); try { const r = await api.post<{ message: Msg }>(`/v1/orgs/${org.uuid}/conversations/${id}/messages`, { text: t }); setText(""); setData(data ? { ...data, messages: [...data.messages, r.message], conversation: { ...data.conversation, status: "human" } } : data); await refetch(); } catch (e) { toast.error("Could not send", (e as Error).message); } finally { setBusy(false); } }
  return (
    <InboxList>
      {loading && !data ? <Loading /> : !data ? null : (
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border bg-card shadow-xs xl:col-span-2">
            <div className="flex items-center gap-3 border-b px-4 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{data.conversation.customer?.name || "Anonymous visitor"}</p><p className="text-xs text-muted-foreground">{data.conversation.customer?.phone || "No phone yet"}{data.conversation.assignee ? ` · with ${data.conversation.assignee.name}` : ""}</p></div><StatusBadge status={data.conversation.status} map={conversationStatus} /></div>
            {data.conversation.status === "needs_human" ? <div className="flex items-center gap-2 border-b bg-warning-soft/50 px-4 py-2 text-xs"><Hand className="size-3.5 text-warning" /> The assistant could not help. Reply below to take over.</div> : null}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin"><MessageThread messages={data.messages} /><div ref={endRef} /></div>
            <div className="border-t p-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {data.conversation.status !== "closed" ? <>{data.conversation.status !== "human" ? <Button size="sm" variant="outline" onClick={() => act("takeover")}><UserRound /> Take over</Button> : <Button size="sm" variant="outline" onClick={() => act("handback")}><Bot /> Hand back to assistant</Button>}<Button size="sm" variant="outline" onClick={() => act("close")}><CheckCircle2 /> Close</Button></> : <Button size="sm" variant="outline" onClick={() => act("reopen")}><RotateCcw /> Reopen</Button>}
              </div>
              {data.conversation.status !== "closed" ? <div className="flex items-end gap-2"><Textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder="Type a reply… (Enter to send, Shift+Enter for a new line)" className="min-h-[44px] resize-none" rows={1} /><Button size="icon" onClick={send} disabled={busy || !text.trim()} aria-label="Send"><SendHorizonal /></Button></div> : <p className="text-center text-xs text-muted-foreground">Closed. Reopen to reply.</p>}
            </div>
          </div>
          <div className="space-y-4">
            <Card><CardHeader><CardTitle>Customer</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><p className="font-medium">{data.conversation.customer?.name || "—"}</p>{data.conversation.customer?.phone ? <p className="flex items-center gap-2 text-muted-foreground"><Phone className="size-3.5" /> <a href={`tel:${data.conversation.customer.phone}`} className="hover:underline">{data.conversation.customer.phone}</a></p> : null}{data.conversation.customer?.address ? <p className="text-muted-foreground">{data.conversation.customer.address}</p> : null}<p className="break-all text-xs text-muted-foreground">From: {data.conversation.pageUrl || "—"}</p></CardContent></Card>
            {has("orders") && data.orders.length ? <Card><CardHeader><CardTitle>Orders</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{data.orders.map((o) => <Link key={o.id} href={`${base}/orders/${o.id}`} className="flex items-center justify-between rounded-md border p-2 hover:bg-accent"><span className="font-medium">#{o.number}</span><span>{money(o.total, o.currency)}</span><StatusBadge status={o.status} map={orderStatus} /></Link>)}</CardContent></Card> : null}
            {has("appointments") && data.appointments.length ? <Card><CardHeader><CardTitle>Appointments</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{data.appointments.map((a) => <Link key={a.id} href={`${base}/appointments/${a.id}`} className="flex items-center justify-between rounded-md border p-2 hover:bg-accent"><span className="font-medium">#{a.number} {a.staffName}</span><StatusBadge status={a.status} map={appointmentStatus} /></Link>)}</CardContent></Card> : null}
            {has("inquiries") && data.inquiries.length ? <Card><CardHeader><CardTitle>Inquiries</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{data.inquiries.map((i) => <Link key={i.id} href={`${base}/inquiries/${i.id}`} className="flex items-center justify-between rounded-md border p-2 hover:bg-accent"><span className="font-medium">#{i.number} {i.type}</span><StatusBadge status={i.status} map={inquiryStatus} /></Link>)}</CardContent></Card> : null}
          </div>
        </div>
      )}
    </InboxList>
  );
}
