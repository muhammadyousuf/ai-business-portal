"use client";
import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useApi } from "@assistflow/shared/api/hooks";
import { api } from "@assistflow/shared/api/client";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Button } from "@assistflow/shared/ui/button";
import { EmptyState, Loading } from "@assistflow/shared/components/states";
import { cn, relativeTime } from "@assistflow/shared/lib/utils";

export function NotificationsPage({ base, linkPrefix = "" }: { base: "/v1/me" | "/v1/admin"; linkPrefix?: string }) {
  const { data, loading, refetch } = useApi<{ items: { id: string; title: string; body: string; link: string; readAt?: string; createdAt: string }[]; unread: number }>(`${base}/notifications?limit=50`);
  async function markRead(id: string) { await api.patch(`${base}/notifications/${id}/read`); await refetch(); }
  async function readAll() { await api.post(`${base}/notifications/read-all`); await refetch(); }
  return (
    <>
      <PageHeader title="Notifications" description={data ? `${data.unread} unread` : undefined} actions={<Button size="sm" variant="outline" onClick={readAll} disabled={!data?.unread}><CheckCheck /> Mark all read</Button>} />
      {loading && !data ? <Loading /> : !data?.items.length ? <EmptyState icon={Bell} title="No notifications yet" description="New orders, messages, invitations and status changes will show up here." /> : (
        <div className="divide-y rounded-xl border bg-card shadow-xs">
          {data.items.map((n) => (
            <div key={n.id} className={cn("flex items-start gap-3 px-4 py-3", !n.readAt && "bg-brand-soft/30")} onClick={() => { if (!n.readAt) void markRead(n.id); }}>
              <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-brand")} />
              <div className="min-w-0 flex-1"><p className="text-sm font-medium">{n.title}</p>{n.body ? <p className="text-xs text-muted-foreground">{n.body}</p> : null}<p className="mt-0.5 text-[11px] text-muted-foreground">{relativeTime(n.createdAt, new Date())}</p></div>
              {n.link ? <Link href={`${linkPrefix}${n.link}`} className="shrink-0 text-xs font-medium text-brand hover:underline">Open</Link> : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
