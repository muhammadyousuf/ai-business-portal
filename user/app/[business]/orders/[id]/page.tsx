import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight, MapPin, MessageCircle, Phone, Printer, X } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { ChannelBadge } from "@assistflow/shared/components/channel-badge";
import { Pill, StatusBadge } from "@assistflow/shared/components/pill";
import { ConversationThread } from "@/components/business/conversation-thread";
import { orderStatus } from "@assistflow/shared/lib/status";
import { conversationById, customerById, deliveryZones, fmtPKR, notificationLog, orderById } from "@assistflow/shared/mock/business";
import { formatDate } from "@assistflow/shared/lib/utils";

const steps = ["pending", "confirmed", "preparing", "out_for_delivery", "completed"];

export default async function OrderDetail({ params }: { params: Promise<{ business: string; id: string }> }) {
  const { business: slug, id } = await params;
  const o = orderById(id);
  if (!o) notFound();
  const base = `/${slug}`;
  const c = customerById(o.customerId)!;
  const zone = deliveryZones.find((z) => z.id === o.zoneId);
  const conv = o.conversationId ? conversationById(o.conversationId) : undefined;
  const idx = steps.indexOf(o.status);
  const notes = notificationLog.filter((n) => n.subject.includes(o.number));
  return (
    <>
      <nav className="flex items-center gap-1 text-xs text-muted-foreground"><Link href={`${base}/orders`} className="hover:text-foreground">Orders</Link><ChevronRight className="size-3" /><span className="text-foreground">{o.number}</span></nav>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="flex items-center gap-2"><h1 className="text-xl font-semibold tracking-tight">Order {o.number}</h1><StatusBadge status={o.status} map={orderStatus} /><ChannelBadge channel={o.channel} /></div><p className="mt-1 text-sm text-muted-foreground">Placed {formatDate(o.placedAt, { hour: "2-digit", minute: "2-digit" })} · collected by {o.source === "ai" ? "AI assistant" : "staff"}</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm"><Printer /> Kitchen slip</Button>
          <Button variant="outline" size="sm" asChild><a href={`tel:${c.phone}`}><Phone /> Call {c.name.split(" ")[0]}</a></Button>
          {o.status === "pending" ? <><Button size="sm"><Check /> Confirm order</Button><Button variant="ghost" size="sm" className="text-destructive"><X /> Reject</Button></> : null}
        </div>
      </div>

      {o.status !== "cancelled" ? (
        <Card><CardContent className="p-5">
          <ol className="flex items-center gap-2">
            {steps.map((s, i) => <li key={s} className="flex flex-1 items-center gap-2"><div className="flex flex-col items-center gap-1.5 text-center"><span className={`flex size-6 items-center justify-center rounded-full text-[11px] font-semibold ${i < idx ? "bg-success text-white" : i === idx ? "bg-brand text-brand-foreground ring-4 ring-brand-soft" : "bg-muted text-muted-foreground"}`}>{i + 1}</span><span className={`text-[11px] ${i === idx ? "font-medium" : "text-muted-foreground"}`}>{orderStatus[s].label}</span></div>{i < steps.length - 1 ? <span className={`mb-5 h-px flex-1 ${i < idx ? "bg-success" : "bg-border"}`} /> : null}</li>)}
          </ol>
          {o.status === "pending" ? <p className="mt-4 rounded-md bg-warning-soft/60 px-3 py-2 text-sm">The AI told the customer you would call to confirm. Confirming sends a WhatsApp and email update to {c.name.split(" ")[0]} automatically.</p> : null}
        </CardContent></Card>
      ) : <p className="rounded-md bg-muted px-3 py-2 text-sm">Cancelled. {o.notes}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Items</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <tbody>
                  {o.items.map((it, i) => <tr key={i} className="border-b last:border-0"><td className="py-2">{it.qty} × {it.name}{it.options ? <span className="text-muted-foreground"> · {it.options}</span> : null}</td><td className="py-2 text-right tabular text-muted-foreground">{fmtPKR(it.unitPrice)}</td><td className="py-2 text-right tabular">{fmtPKR(it.qty * it.unitPrice)}</td></tr>)}
                </tbody>
                <tfoot>
                  <tr><td colSpan={2} className="pt-3 text-right text-muted-foreground">Subtotal</td><td className="pt-3 text-right tabular">{fmtPKR(o.subtotal)}</td></tr>
                  <tr><td colSpan={2} className="pt-1 text-right text-muted-foreground">Delivery{zone ? ` · ${zone.name}` : ""}</td><td className="pt-1 text-right tabular">{fmtPKR(o.deliveryCharge)}</td></tr>
                  <tr><td colSpan={2} className="pt-2 text-right font-semibold">Total (cash on delivery)</td><td className="pt-2 text-right text-lg font-semibold tabular">{fmtPKR(o.total)}</td></tr>
                </tfoot>
              </table>
              {o.notes ? <p className="mt-3 rounded bg-warning-soft/50 px-2 py-1.5 text-sm">Customer note: {o.notes}</p> : null}
            </CardContent>
          </Card>
          {conv ? <Card><CardHeader><CardTitle>How this order was collected</CardTitle><CardDescription>The AI only quoted prices and zones from your catalog. <Link href={`${base}/inbox/${conv.id}`} className="text-brand hover:underline">Open conversation</Link></CardDescription></CardHeader><CardContent><ConversationThread messages={conv.messages} compact /></CardContent></Card> : null}
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium"><Link href={`${base}/customers/${c.id}`} className="hover:underline">{c.name}</Link></p>
              <p className="flex items-center gap-2 text-muted-foreground"><Phone className="size-3.5" /> {c.phone}</p>
              <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0" /> {o.address}</p>
              <div className="flex flex-wrap gap-1 pt-1">{c.tags.map((t) => <Pill key={t}>{t}</Pill>)}</div>
              <p className="pt-1 text-xs text-muted-foreground">{c.orders} previous orders · {fmtPKR(c.spent)} lifetime{c.notes ? ` · ${c.notes}` : ""}</p>
              <Button variant="outline" size="sm" className="mt-2 w-full"><MessageCircle /> Message on WhatsApp</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Notifications sent</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs">
              {notes.length ? notes.map((n) => <div key={n.id} className="flex items-start justify-between gap-2"><span><span className="font-medium capitalize">{n.kind}</span> → {n.to}</span><Pill tone={n.status === "delivered" ? "success" : n.status === "failed" ? "destructive" : "neutral"}>{n.status}{n.attempts > 1 ? ` ×${n.attempts}` : ""}</Pill></div>) : <p className="text-muted-foreground">No notification records for this order.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
