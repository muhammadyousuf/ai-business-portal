import { Filter } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@assistflow/shared/ui/table";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { ChannelBadge } from "@assistflow/shared/components/channel-badge";
import { StatusBadge, Pill } from "@assistflow/shared/components/pill";
import { MiniBars } from "@assistflow/shared/components/mini-bars";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { orderStatus } from "@assistflow/shared/lib/status";
import { businesses, industryLabel } from "@assistflow/shared/mock/platform";
import { orders, customerById, fmtPKR } from "@assistflow/shared/mock/business";
import { relativeTime } from "@assistflow/shared/lib/utils";

const others = [
  { id: "y1", business: "Lotus Dental Clinic", type: "Appointment", customer: "Fatima A.", channel: "whatsapp" as const, status: "confirmed", value: "$0 · consult", at: "2026-10-31T11:12:00Z" },
  { id: "y2", business: "Spice Route Kitchen", type: "Order", customer: "Priya S.", channel: "website" as const, status: "pending", value: "£42.50", at: "2026-10-31T11:50:00Z" },
  { id: "y3", business: "City Grammar School", type: "Admission inquiry", customer: "Mr. Rehman", channel: "whatsapp" as const, status: "confirmed", value: "Grade 6", at: "2026-10-31T09:30:00Z" },
  { id: "y4", business: "Sweet Crumbs Bakery", type: "Cake booking", customer: "Emily R.", channel: "website" as const, status: "confirmed", value: "£85.00", at: "2026-10-30T17:20:00Z" },
  { id: "y5", business: "Urban Threads", type: "Order", customer: "Dana K.", channel: "instagram" as const, status: "pending", value: "$64.00", at: "2026-10-30T15:00:00Z" },
];

export default function AdminOrders() {
  const rows = [
    ...orders.map((o) => ({ id: o.id, business: "Karachi Biryani House", type: "Order", customer: customerById(o.customerId)?.name ?? "", channel: o.channel, status: o.status, value: fmtPKR(o.total), at: o.placedAt })),
    ...others,
  ].sort((a, b) => b.at.localeCompare(a.at));
  const byIndustry = Object.entries(businesses.reduce<Record<string, number>>((acc, b) => { acc[industryLabel[b.industry]] = (acc[industryLabel[b.industry]] ?? 0) + b.usage.orders; return acc; }, {})).map(([label, value]) => ({ label, value }));
  return (
    <>
      <PageHeader title="All orders & inquiries" description="Everything the AI assistants collected across businesses: orders, bookings, appointments and admission inquiries. Values belong to each business." />
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><CardTitle>Requests by industry (30d)</CardTitle><CardDescription>Restaurants convert most; schools and clinics are inquiries, not orders.</CardDescription></CardHeader><CardContent><MiniBars data={byIndustry} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Conversion</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
          {[["Restaurants", 46], ["Bakeries", 42], ["Ecommerce", 30], ["Clinics", 36], ["Schools", 41]].map(([l, v]) => (
            <div key={l as string}><div className="flex justify-between text-xs"><span>{l}</span><span className="tabular">{v}% of conversations</span></div><div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{ width: `${v}%` }} /></div></div>
          ))}
        </CardContent></Card>
      </section>
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search customer or business…" className="h-8 w-64" />
        <Button variant="outline" size="sm"><Filter /> Business</Button><Button variant="outline" size="sm"><Filter /> Type</Button><Button variant="outline" size="sm"><Filter /> Status</Button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Business</TableHead><TableHead>Type</TableHead><TableHead>Customer</TableHead><TableHead>Channel</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Value</TableHead><TableHead className="text-right">When</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.business}</TableCell>
                <TableCell><Pill>{r.type}</Pill></TableCell>
                <TableCell>{r.customer}</TableCell>
                <TableCell><ChannelBadge channel={r.channel} /></TableCell>
                <TableCell><StatusBadge status={r.status} map={orderStatus} /></TableCell>
                <TableCell className="text-right tabular">{r.value}</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">{relativeTime(r.at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
