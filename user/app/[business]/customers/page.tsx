import Link from "next/link";
import { Download, Filter, Plus } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@assistflow/shared/ui/table";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { ChannelBadge } from "@assistflow/shared/components/channel-badge";
import { Pill } from "@assistflow/shared/components/pill";
import { UserAvatar } from "@assistflow/shared/components/user-avatar";
import { customers, fmtPKR } from "@assistflow/shared/mock/business";
import { relativeTime } from "@assistflow/shared/lib/utils";

export default async function CustomersPage({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params;
  const base = `/${slug}`;
  return (
    <>
      <PageHeader title="Customers" description={`${customers.length} customers · ${customers.filter((c) => c.tags.includes("repeat") || c.tags.includes("vip")).length} returning · built automatically from conversations and orders`} actions={<><Button variant="outline" size="sm"><Download /> Export</Button><Button size="sm"><Plus /> Add customer</Button></>} />
      <div className="flex flex-wrap items-center gap-2"><Input placeholder="Search name or phone…" className="h-8 w-56" /><Button variant="outline" size="sm"><Filter /> Tags</Button><Button variant="outline" size="sm"><Filter /> Area</Button><Button variant="outline" size="sm"><Filter /> Channel</Button></div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Customer</TableHead><TableHead className="hidden md:table-cell">Area</TableHead><TableHead>Tags</TableHead><TableHead className="hidden lg:table-cell">First via</TableHead><TableHead className="text-right">Orders</TableHead><TableHead className="text-right">Spent</TableHead><TableHead className="text-right">Last seen</TableHead></TableRow></TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell><Link href={`${base}/customers/${c.id}`} className="flex items-center gap-2.5"><UserAvatar name={c.name} className="size-7 [&_span]:text-[10px]" /><div><p className="font-medium hover:underline">{c.name}</p><p className="text-[11px] text-muted-foreground">{c.phone}</p></div></Link></TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{c.area ?? "—"}</TableCell>
                <TableCell><span className="flex flex-wrap gap-1">{c.tags.map((t) => <Pill key={t} tone={t === "vip" ? "brand" : t === "complaint" ? "destructive" : t === "new" ? "info" : "neutral"}>{t}</Pill>)}</span></TableCell>
                <TableCell className="hidden lg:table-cell"><ChannelBadge channel={c.channel} /></TableCell>
                <TableCell className="text-right tabular">{c.orders}</TableCell>
                <TableCell className="text-right tabular font-medium">{fmtPKR(c.spent)}</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">{relativeTime(c.lastSeen)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
