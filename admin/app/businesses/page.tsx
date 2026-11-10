import Link from "next/link";
import { Download, Filter, Plus } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@assistflow/shared/ui/table";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { BrandMark } from "@assistflow/shared/components/brand-mark";
import { ChannelBadge } from "@assistflow/shared/components/channel-badge";
import { Pill, StatusBadge } from "@assistflow/shared/components/pill";
import { businessStatus } from "@assistflow/shared/lib/status";
import { businesses, industryLabel, planByKey } from "@assistflow/shared/mock/platform";
import { formatDate, fmtNum, fmtUsd } from "@assistflow/shared/lib/utils";

export default function BusinessesPage() {
  return (
    <>
      <PageHeader
        title="Businesses"
        description={`${businesses.length} registered · ${businesses.filter((b) => b.status === "active").length} active · ${businesses.filter((b) => b.status === "trial").length} trial · ${businesses.filter((b) => b.status === "suspended").length} suspended`}
        actions={<><Button variant="outline" size="sm"><Download /> CSV</Button><Button size="sm"><Plus /> Register business</Button></>}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search by name, owner or email…" className="h-8 w-64" />
        <Button variant="outline" size="sm"><Filter /> Status</Button>
        <Button variant="outline" size="sm"><Filter /> Plan</Button>
        <Button variant="outline" size="sm"><Filter /> Industry</Button>
        <Button variant="outline" size="sm"><Filter /> Country</Button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Business</TableHead>
              <TableHead className="hidden md:table-cell">Industry</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Channels</TableHead>
              <TableHead className="hidden xl:table-cell text-right">AI replies</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Orders (30d)</TableHead>
              <TableHead className="text-right">MRR</TableHead>
              <TableHead className="hidden md:table-cell text-right">Renews</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {businesses.map((b) => {
              const plan = planByKey(b.plan);
              return (
                <TableRow key={b.id}>
                  <TableCell>
                    <Link href={`/businesses/${b.id}`} className="flex items-center gap-2.5">
                      <BrandMark text={b.branding.logoText} className="size-7 text-xs" />
                      <div className="min-w-0"><p className="truncate font-medium hover:underline">{b.name}</p><p className="truncate text-[11px] text-muted-foreground">{b.owner.name} · {b.city}, {b.country}</p></div>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{industryLabel[b.industry]}</TableCell>
                  <TableCell><Pill tone="brand">{plan.name}</Pill></TableCell>
                  <TableCell><StatusBadge status={b.status} map={businessStatus} /></TableCell>
                  <TableCell className="hidden lg:table-cell"><span className="flex gap-1">{b.channels.map((c) => <ChannelBadge key={c} channel={c} withLabel={false} />)}</span></TableCell>
                  <TableCell className="hidden xl:table-cell text-right tabular text-muted-foreground">{fmtNum(b.usage.aiReplies)} <span className="text-[11px]">/ {fmtNum(plan.aiReplies)}</span></TableCell>
                  <TableCell className="hidden lg:table-cell text-right tabular">{b.usage.orders}</TableCell>
                  <TableCell className="text-right tabular font-medium">{b.mrrUsd ? fmtUsd(b.mrrUsd) : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="hidden md:table-cell text-right text-xs text-muted-foreground">{formatDate(b.renewsAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
