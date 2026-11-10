import Link from "next/link";
import { Check, Mail, MessageCircle, Phone, X } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent } from "@assistflow/shared/ui/card";
import { ChannelBadge } from "@assistflow/shared/components/channel-badge";
import { StatusBadge } from "@assistflow/shared/components/pill";
import { orderStatus } from "@assistflow/shared/lib/status";
import { customerById, fmtPKR } from "@assistflow/shared/mock/business";
import type { Order } from "@assistflow/shared/mock/types";
import { relativeTime } from "@assistflow/shared/lib/utils";

export function OrderCard({ order, base }: { order: Order; base: string }) {
  const c = customerById(order.customerId);
  return (
    <Card className={order.status === "pending" ? "border-warning/50" : ""}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2"><Link href={`${base}/orders/${order.id}`} className="text-sm font-semibold hover:underline">{order.number}</Link><StatusBadge status={order.status} map={orderStatus} /><ChannelBadge channel={order.channel} withLabel={false} /></div>
            <p className="mt-0.5 text-xs text-muted-foreground">{c?.name} · {c?.phone} · {relativeTime(order.placedAt)}</p>
          </div>
          <p className="text-lg font-semibold tabular">{fmtPKR(order.total)}</p>
        </div>
        <ul className="mt-3 space-y-0.5 text-sm">
          {order.items.map((it, i) => <li key={i} className="flex justify-between"><span>{it.qty} × {it.name}{it.options ? <span className="text-muted-foreground"> ({it.options})</span> : null}</span><span className="tabular text-muted-foreground">{fmtPKR(it.qty * it.unitPrice)}</span></li>)}
          <li className="flex justify-between text-xs text-muted-foreground"><span>Delivery · {order.address}</span><span className="tabular">{fmtPKR(order.deliveryCharge)}</span></li>
        </ul>
        {order.notes ? <p className="mt-2 rounded bg-warning-soft/50 px-2 py-1 text-xs">Note: {order.notes}</p> : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {order.status === "pending" ? (
            <><Button size="sm"><Check /> Confirm</Button><Button size="sm" variant="outline"><Phone /> Call {c?.name.split(" ")[0]}</Button><Button size="sm" variant="ghost" className="text-destructive"><X /> Reject</Button></>
          ) : order.status === "confirmed" ? (
            <><Button size="sm" variant="outline">Mark preparing</Button><Button size="sm" variant="outline">Out for delivery</Button></>
          ) : null}
          <span className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className={`inline-flex items-center gap-1 ${order.notified.email ? "" : "line-through"}`}><Mail className="size-3" /> email</span>
            <span className={`inline-flex items-center gap-1 ${order.notified.whatsapp ? "" : "line-through"}`}><MessageCircle className="size-3" /> WhatsApp</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
