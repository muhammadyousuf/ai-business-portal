import Link from "next/link";
import { Download, Filter, Plus } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@assistflow/shared/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@assistflow/shared/ui/table";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { ChannelBadge } from "@assistflow/shared/components/channel-badge";
import { StatusBadge } from "@assistflow/shared/components/pill";
import { OrderCard } from "@/components/business/order-card";
import { orderStatus } from "@assistflow/shared/lib/status";
import { customerById, fmtPKR, orders } from "@assistflow/shared/mock/business";
import { relativeTime } from "@assistflow/shared/lib/utils";

export default async function OrdersPage({ params, searchParams }: { params: Promise<{ business: string }>; searchParams: Promise<{ status?: string }> }) {
  const { business: slug } = await params;
  const { status = "all" } = await searchParams;
  const base = `/${slug}`;
  const pending = orders.filter((o) => o.status === "pending");
  const list = status === "all" ? orders : orders.filter((o) => o.status === status);
  return (
    <>
      <PageHeader title="Orders" description={`${orders.length} this week · ${pending.length} pending confirmation · Rs. 15,300 order value`} actions={<><Button variant="outline" size="sm"><Download /> Export CSV</Button><Button size="sm"><Plus /> Manual order</Button></>} />
      {pending.length && status === "all" ? <section className="grid gap-3 lg:grid-cols-2">{pending.map((o) => <OrderCard key={o.id} order={o} base={base} />)}</section> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={status}><TabsList className="h-8">{["all", "pending", "confirmed", "completed", "cancelled"].map((s) => <TabsTrigger key={s} value={s} className="h-6 px-2 text-xs capitalize" asChild><a href={`?status=${s}`}>{s}</a></TabsTrigger>)}</TabsList></Tabs>
        <Input placeholder="Search order or customer…" className="ml-auto h-8 w-56" /><Button variant="outline" size="sm"><Filter /> Channel</Button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead className="hidden md:table-cell">Items</TableHead><TableHead>Channel</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Placed</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium"><Link href={`${base}/orders/${o.id}`} className="hover:underline">{o.number}</Link>{o.source === "manual" ? <span className="ml-1.5 text-[10px] text-muted-foreground">manual</span> : null}</TableCell>
                <TableCell>{customerById(o.customerId)?.name}</TableCell>
                <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</TableCell>
                <TableCell><ChannelBadge channel={o.channel} /></TableCell>
                <TableCell><StatusBadge status={o.status} map={orderStatus} /></TableCell>
                <TableCell className="text-right tabular font-medium">{fmtPKR(o.total)}</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">{relativeTime(o.placedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
