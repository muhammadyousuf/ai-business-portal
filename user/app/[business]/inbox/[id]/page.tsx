import Link from "next/link";
import { notFound } from "next/navigation";
import { Bot, CheckCircle2, Filter, Hand, MapPin, Phone, SendHorizonal, Sparkles, UserRound } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Input } from "@assistflow/shared/ui/input";
import { Textarea } from "@assistflow/shared/ui/textarea";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { ChannelBadge } from "@assistflow/shared/components/channel-badge";
import { Pill, StatusBadge } from "@assistflow/shared/components/pill";
import { ConversationThread } from "@/components/business/conversation-thread";
import { conversationStatus, orderStatus } from "@assistflow/shared/lib/status";
import { conversationById, conversations, customerById, fmtPKR, orderById, staffById } from "@assistflow/shared/mock/business";
import { cn, relativeTime } from "@assistflow/shared/lib/utils";

export default async function InboxPage({ params }: { params: Promise<{ business: string; id: string }> }) {
  const { business: slug, id } = await params;
  const base = `/${slug}`;
  const active = conversationById(id);
  if (!active) notFound();
  const c = customerById(active.customerId)!;
  const order = active.orderId ? orderById(active.orderId) : undefined;
  const agent = staffById(active.assignedTo);
  const sorted = [...conversations].sort((a, b) => (a.status === "needs_attention" ? -1 : 0) - (b.status === "needs_attention" ? -1 : 0) || b.lastMessageAt.localeCompare(a.lastMessageAt));

  return (
    <>
      <PageHeader title="Inbox" description="Website and WhatsApp in one place. The AI handles routine questions; take over any time." actions={<><Button variant="outline" size="sm"><Filter /> Channel</Button><Button variant="outline" size="sm"><Filter /> Status</Button></>} />
      <div className="grid gap-4 lg:grid-cols-12">
        <aside className="overflow-hidden rounded-xl border bg-card shadow-xs lg:col-span-4">
          <div className="border-b p-2"><Input placeholder="Search conversations…" className="h-8" /></div>
          <ul className="max-h-[calc(100dvh-16rem)] divide-y overflow-y-auto scrollbar-thin">
            {sorted.map((cv) => {
              const cust = customerById(cv.customerId)!;
              return (
                <li key={cv.id}>
                  <Link href={`${base}/inbox/${cv.id}`} className={cn("flex gap-3 px-3 py-2.5 hover:bg-accent", cv.id === active.id && "bg-brand-soft/60")}>
                    <ChannelBadge channel={cv.channel} withLabel={false} className="mt-0.5 h-fit" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2"><p className={cn("truncate text-sm", cv.unread ? "font-semibold" : "font-medium")}>{cust.name}</p><span className="shrink-0 text-[10px] text-muted-foreground">{relativeTime(cv.lastMessageAt)}</span></div>
                      <p className="truncate text-xs text-muted-foreground">{cv.preview}</p>
                      <div className="mt-1 flex items-center gap-1.5"><StatusBadge status={cv.status} map={conversationStatus} />{cv.unread ? <span className="size-1.5 rounded-full bg-brand" /> : null}</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border bg-card shadow-xs lg:col-span-5">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <div className="min-w-0 flex-1"><p className="flex items-center gap-2 text-sm font-semibold">{c.name} <ChannelBadge channel={active.channel} /></p><p className="text-xs text-muted-foreground">{c.phone} · {c.area}{active.language === "ur" ? " · replying in Urdu" : ""}</p></div>
            <StatusBadge status={active.status} map={conversationStatus} />
          </div>
          {active.status === "needs_attention" ? (
            <div className="flex items-start gap-2 border-b bg-warning-soft/50 px-4 py-2.5 text-xs"><Hand className="mt-0.5 size-3.5 shrink-0 text-warning" /><p><span className="font-medium">The assistant stopped here.</span> Confidence {Math.round((active.aiConfidence ?? 0) * 100)}%: the customer asked for a policy exception. Reply yourself, or add a rule in the knowledge base.</p></div>
          ) : null}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin"><ConversationThread messages={active.messages} /></div>
          <div className="border-t p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <Button size="sm" variant={active.status === "human" ? "secondary" : "outline"}><UserRound /> {active.status === "human" ? `Assigned to ${agent?.name.split(" ")[0]}` : "Take over from AI"}</Button>
              <Button size="sm" variant="outline"><Bot /> Hand back to AI</Button>
              <Button size="sm" variant="outline"><CheckCircle2 /> Mark resolved</Button>
              <Button size="sm" variant="ghost" className="text-brand"><Sparkles /> Suggest reply</Button>
            </div>
            <div className="flex items-end gap-2"><Textarea placeholder={`Reply to ${c.name.split(" ")[0]} on ${active.channel === "whatsapp" ? "WhatsApp" : "the website"}…`} className="min-h-[40px] resize-none" rows={1} /><Button size="icon" aria-label="Send"><SendHorizonal /></Button></div>
          </div>
        </section>

        <aside className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium"><Link href={`${base}/customers/${c.id}`} className="hover:underline">{c.name}</Link></p>
              <p className="flex items-center gap-2 text-muted-foreground"><Phone className="size-3.5" /> {c.phone}</p>
              {c.area ? <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-3.5" /> {c.area}</p> : null}
              <div className="flex flex-wrap gap-1">{c.tags.map((t) => <Pill key={t}>{t}</Pill>)}</div>
              <p className="text-xs text-muted-foreground">{c.orders} orders · {fmtPKR(c.spent)} lifetime · since {new Date(c.firstSeen).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</p>
              {c.notes ? <p className="rounded bg-muted px-2 py-1 text-xs">{c.notes}</p> : null}
            </CardContent>
          </Card>
          {order ? (
            <Card>
              <CardHeader><CardTitle>Linked order</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><Link href={`${base}/orders/${order.id}`} className="font-medium hover:underline">{order.number}</Link><StatusBadge status={order.status} map={orderStatus} /></div>
                <ul className="text-xs text-muted-foreground">{order.items.map((i, k) => <li key={k}>{i.qty} × {i.name}</li>)}</ul>
                <p className="font-semibold tabular">{fmtPKR(order.total)}</p>
                {order.status === "pending" ? <Button size="sm" className="w-full">Confirm order</Button> : null}
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader><CardTitle>AI notes</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-xs text-muted-foreground">
              <p>Confidence: <span className="font-medium text-foreground">{Math.round((active.aiConfidence ?? 0) * 100)}%</span></p>
              <p>Tools used: {Array.from(new Set(active.messages.map((m) => m.tool).filter(Boolean))).join(", ") || "none"}</p>
              <p>Every price and zone quoted came from your catalog. The assistant cannot invent a price.</p>
              <button className="text-brand hover:underline">Report a wrong answer</button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
