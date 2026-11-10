import { userAppUrl } from "@/lib/links";
import Link from "next/link";
import { Filter, ShieldCheck } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@assistflow/shared/ui/table";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { ChannelBadge } from "@assistflow/shared/components/channel-badge";
import { StatusBadge } from "@assistflow/shared/components/pill";
import { KpiCard } from "@assistflow/shared/dashboard/kpi-card";
import { Bot, Inbox, UserRound, AlertTriangle } from "lucide-react";
import { conversationStatus } from "@assistflow/shared/lib/status";
import { businesses } from "@assistflow/shared/mock/platform";
import { conversations, customerById } from "@assistflow/shared/mock/business";
import { relativeTime, fmtNum } from "@assistflow/shared/lib/utils";

const others = [
  { id: "x1", business: "Lotus Dental Clinic", customer: "Fatima A.", channel: "whatsapp" as const, status: "resolved", preview: "Appointment request for teeth cleaning, Tue 4 Nov 11:00", at: "2026-10-31T11:12:00Z", confidence: 0.94 },
  { id: "x2", business: "Spice Route Kitchen", customer: "James W.", channel: "website" as const, status: "ai", preview: "Is the lamb rogan josh gluten free?", at: "2026-10-31T11:05:00Z", confidence: 0.88 },
  { id: "x3", business: "Urban Threads", customer: "Dana K.", channel: "instagram" as const, status: "needs_attention", preview: "Return without receipt, bought as gift…", at: "2026-10-31T10:40:00Z", confidence: 0.38 },
  { id: "x4", business: "City Grammar School", customer: "Mr. Rehman", channel: "whatsapp" as const, status: "resolved", preview: "Admission form for Grade 6, documents list sent", at: "2026-10-31T09:30:00Z", confidence: 0.91 },
  { id: "x5", business: "Sweet Crumbs Bakery", customer: "Emily R.", channel: "website" as const, status: "resolved", preview: "Custom 2-tier cake booking for 8 Nov, Rs… £85 quote", at: "2026-10-30T17:20:00Z", confidence: 0.9 },
];

export default function AdminConversations() {
  const rows = [
    ...conversations.map((c) => ({ id: c.id, business: "Karachi Biryani House", customer: customerById(c.customerId)?.name ?? "", channel: c.channel, status: c.status, preview: c.preview, at: c.lastMessageAt, confidence: c.aiConfidence ?? 0, href: userAppUrl("karachi-biryani", "/inbox/" + c.id) })),
    ...others.map((o) => ({ ...o, href: undefined as string | undefined })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const total = businesses.reduce((s, b) => s + b.usage.conversations, 0);
  return (
    <>
      <PageHeader title="All conversations" description="Cross-business view for support and quality monitoring. Access is role-gated and every open is written to the audit log." />
      <div className="flex items-start gap-3 rounded-lg border bg-info-soft/40 p-3 text-xs">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-info" />
        <p><span className="font-medium">Privacy rule.</span> Customer phone numbers and emails are masked for support roles. Only super_admin can unmask, and only inside an impersonation session tied to a ticket.</p>
      </div>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label="Conversations (30d)" value={fmtNum(total)} icon={Inbox} />
        <KpiCard label="AI resolution rate" value="84%" delta="platform average" icon={Bot} tone="brand" />
        <KpiCard label="Human handovers" value="11%" delta="target under 15%" icon={UserRound} />
        <KpiCard label="Needs attention now" value={rows.filter((r) => r.status === "needs_attention").length} delta="unanswered > 30 min" icon={AlertTriangle} tone="warning" />
      </section>
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search by business or customer…" className="h-8 w-64" />
        <Button variant="outline" size="sm"><Filter /> Business</Button><Button variant="outline" size="sm"><Filter /> Channel</Button><Button variant="outline" size="sm"><Filter /> Status</Button><Button variant="outline" size="sm"><Filter /> Low confidence</Button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Business</TableHead><TableHead>Customer</TableHead><TableHead>Channel</TableHead><TableHead>Status</TableHead><TableHead className="hidden lg:table-cell">Last message</TableHead><TableHead className="hidden md:table-cell text-right">AI conf.</TableHead><TableHead className="text-right">When</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.business}</TableCell>
                <TableCell>{r.href ? <Link href={r.href} className="hover:underline">{r.customer}</Link> : r.customer}</TableCell>
                <TableCell><ChannelBadge channel={r.channel} /></TableCell>
                <TableCell><StatusBadge status={r.status} map={conversationStatus} /></TableCell>
                <TableCell className="hidden max-w-xs truncate text-muted-foreground lg:table-cell">{r.preview}</TableCell>
                <TableCell className={`hidden text-right tabular md:table-cell ${r.confidence < 0.6 ? "text-warning" : "text-muted-foreground"}`}>{Math.round(r.confidence * 100)}%</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">{relativeTime(r.at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
