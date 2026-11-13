"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Inbox } from "lucide-react";
import { useApi, usePolling } from "@assistflow/shared/api/hooks";
import { qs } from "@assistflow/shared/api/client";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Input } from "@assistflow/shared/ui/input";
import { Select } from "@assistflow/shared/ui/select";
import { EmptyState, Loading } from "@assistflow/shared/components/states";
import { StatusBadge } from "@assistflow/shared/components/pill";
import { conversationStatus } from "@assistflow/shared/lib/status";
import { cn, relativeTime } from "@assistflow/shared/lib/utils";
import { useOrg } from "@/lib/org-context";

export interface ConvRow { id: string; customer: { name: string; phone: string }; status: string; lastMessagePreview: string; lastMessageAt: string; unreadForStaff: number; branchId?: string }

export function InboxList({ children }: { children?: React.ReactNode }) {
  const { org, base } = useOrg(); const { id } = useParams<{ id?: string }>();
  const [status, setStatus] = React.useState("open"); const [q, setQ] = React.useState("");
  const { data, loading, refetch } = useApi<{ items: ConvRow[]; counts: Record<string, number> }>(`/v1/orgs/${org.uuid}/conversations${qs({ status, q, limit: 50 })}`);
  usePolling(refetch, 5000);
  const counts = data?.counts ?? {};
  return (
    <>
      <PageHeader title="Inbox" description={`${counts.needs_human ?? 0} need a human · ${counts.human ?? 0} with your team · ${counts.bot ?? 0} handled by the assistant`} />
      <div className="grid gap-4 lg:grid-cols-12">
        <aside className="overflow-hidden rounded-xl border bg-card shadow-xs lg:col-span-4">
          <div className="flex gap-2 border-b p-2"><Input placeholder="Search…" className="h-8" value={q} onChange={(e) => setQ(e.target.value)} /><Select className="h-8 w-36" value={status} onChange={(e) => setStatus(e.target.value)}><option value="open">Open</option><option value="needs_human">Needs human</option><option value="human">With team</option><option value="bot">Assistant</option><option value="closed">Closed</option></Select></div>
          <ul className="max-h-[calc(100dvh-18rem)] divide-y overflow-y-auto scrollbar-thin">
            {loading && !data ? <li><Loading /></li> : !data?.items.length ? <li className="p-6 text-center text-xs text-muted-foreground">No conversations here.</li> : data.items.map((c) => (
              <li key={c.id}><Link href={`${base}/inbox/${c.id}`} className={cn("block px-3 py-2.5 hover:bg-accent", c.id === id && "bg-brand-soft/60")}>
                <div className="flex items-center justify-between gap-2"><p className={cn("truncate text-sm", c.unreadForStaff ? "font-semibold" : "font-medium")}>{c.customer?.name || "Anonymous visitor"}</p><span className="shrink-0 text-[10px] text-muted-foreground">{relativeTime(c.lastMessageAt, new Date())}</span></div>
                <p className="truncate text-xs text-muted-foreground">{c.lastMessagePreview}</p>
                <div className="mt-1 flex items-center gap-1.5"><StatusBadge status={c.status} map={conversationStatus} />{c.unreadForStaff ? <span className="size-1.5 rounded-full bg-brand" /> : null}</div>
              </Link></li>))}
          </ul>
        </aside>
        <section className="lg:col-span-8">{children ?? <EmptyState icon={Inbox} title="Select a conversation" description="Customer conversations from your website chatbot appear on the left." className="min-h-[400px]" />}</section>
      </div>
    </>
  );
}
