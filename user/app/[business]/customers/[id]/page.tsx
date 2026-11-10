import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Textarea } from "@assistflow/shared/ui/textarea";
import { ChannelBadge } from "@assistflow/shared/components/channel-badge";
import { Pill, StatusBadge } from "@assistflow/shared/components/pill";
import { UserAvatar } from "@assistflow/shared/components/user-avatar";
import { KpiCard } from "@assistflow/shared/dashboard/kpi-card";
import { ShoppingCart, Wallet, Clock } from "lucide-react";
import { conversationStatus, orderStatus } from "@assistflow/shared/lib/status";
import { conversations, customerById, fmtPKR, orders } from "@assistflow/shared/mock/business";
import { formatDate, relativeTime } from "@assistflow/shared/lib/utils";

export default async function CustomerDetail({ params }: { params: Promise<{ business: string; id: string }> }) {
  const { business: slug, id } = await params;
  const c = customerById(id);
  if (!c) notFound();
  const base = `/${slug}`;
  const myOrders = orders.filter((o) => o.customerId === c.id);
  const myConvs = conversations.filter((v) => v.customerId === c.id);
  return (
    <>
      <nav className="flex items-center gap-1 text-xs text-muted-foreground"><Link href={`${base}/customers`} className="hover:text-foreground">Customers</Link><ChevronRight className="size-3" /><span className="text-foreground">{c.name}</span></nav>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3"><UserAvatar name={c.name} className="size-12 [&_span]:text-base" /><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold tracking-tight">{c.name}</h1>{c.tags.map((t) => <Pill key={t} tone={t === "vip" ? "brand" : t === "complaint" ? "destructive" : "neutral"}>{t}</Pill>)}</div><p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1"><Phone className="size-3.5" /> {c.phone}</span>{c.area ? <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {c.area}</span> : null}<span>First via <ChannelBadge channel={c.channel} /></span></p></div></div>
        <div className="flex gap-2"><Button variant="outline" size="sm"><MessageCircle /> WhatsApp</Button><Button variant="outline" size="sm" asChild><a href={`tel:${c.phone}`}><Phone /> Call</a></Button></div>
      </div>
      <section className="grid grid-cols-3 gap-3">
        <KpiCard label="Orders" value={c.orders} icon={ShoppingCart} /><KpiCard label="Lifetime value" value={fmtPKR(c.spent)} icon={Wallet} tone="brand" /><KpiCard label="Customer since" value={formatDate(c.firstSeen, { month: "short", year: "numeric" })} delta={`last seen ${relativeTime(c.lastSeen)}`} icon={Clock} />
      </section>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card><CardHeader><CardTitle>Orders</CardTitle></CardHeader><CardContent className="divide-y">
            {myOrders.length ? myOrders.map((o) => <Link key={o.id} href={`${base}/orders/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-accent/50"><div><p className="font-medium">{o.number} · {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p><p className="text-xs text-muted-foreground">{formatDate(o.placedAt, { hour: "2-digit", minute: "2-digit" })}</p></div><div className="flex items-center gap-3"><StatusBadge status={o.status} map={orderStatus} /><span className="tabular font-medium">{fmtPKR(o.total)}</span></div></Link>) : <p className="py-4 text-xs text-muted-foreground">No orders yet.</p>}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Conversations</CardTitle></CardHeader><CardContent className="divide-y">
            {myConvs.map((v) => <Link key={v.id} href={`${base}/inbox/${v.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-accent/50"><div className="min-w-0"><p className="truncate">{v.preview}</p><p className="text-xs text-muted-foreground">{relativeTime(v.lastMessageAt)}</p></div><div className="flex shrink-0 items-center gap-2"><ChannelBadge channel={v.channel} withLabel={false} /><StatusBadge status={v.status} map={conversationStatus} /></div></Link>)}
          </CardContent></Card>
        </div>
        <div className="space-y-6">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-brand" /> AI insight</CardTitle><CardDescription>From recorded orders only.</CardDescription></CardHeader><CardContent className="text-sm">
            {c.id === "cu_hamza" ? <p>Hamza orders every Friday around 1:30pm for the office, always asks for less spicy, and has spent Rs. 38,400 across 12 orders. A standing Friday reminder or a small loyalty discount is likely to keep this account.</p> : c.id === "cu_ali" ? <p>Ali has ordered 5 times, mostly weekends, always Chicken Biryani. One order was cancelled when unreachable; try WhatsApp before calling.</p> : <p>Not enough history for a reliable pattern yet.</p>}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Notes</CardTitle></CardHeader><CardContent className="space-y-2"><Textarea defaultValue={c.notes ?? ""} placeholder="Preferences, allergies, delivery instructions…" className="min-h-[80px]" /><Button size="sm" variant="outline">Save note</Button></CardContent></Card>
        </div>
      </div>
    </>
  );
}
