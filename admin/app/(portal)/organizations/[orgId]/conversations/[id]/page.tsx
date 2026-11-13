"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useApi } from "@assistflow/shared/api/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { conversationStatus } from "@assistflow/shared/lib/status";
import { Loading as LoadingState } from "@assistflow/shared/components/states";
import { ErrorState, Status, fmtDate } from "@/components/common";
import { MessageThread } from "@/components/message-thread";

export default function AdminConversationPage() {
  const { orgId, id } = useParams<{ orgId: string; id: string }>();
  const { data, loading, error, refetch } = useApi<{ conversation: { id: string; status: string; customer: { name: string; phone: string; email: string; address: string }; pageUrl: string; createdAt: string; lastMessageAt: string }; messages: { id: string; from: string; text: string; authorName?: string; createdAt: string; meta?: Record<string, unknown> }[] }>(`/v1/admin/organizations/${orgId}/conversations/${id}`);
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (loading || !data) return <LoadingState />;
  const c = data.conversation;
  return (
    <>
      <nav className="flex items-center gap-1 text-xs text-muted-foreground"><Link href="/organizations" className="hover:text-foreground">Organizations</Link><ChevronRight className="size-3" /><Link href={`/organizations/${orgId}`} className="hover:text-foreground">Organization</Link><ChevronRight className="size-3" /><span className="text-foreground">Conversation</span></nav>
      <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold tracking-tight">{c.customer?.name || "Anonymous visitor"}</h1><Status value={c.status} map={conversationStatus} /></div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><CardTitle>Messages (read-only)</CardTitle></CardHeader><CardContent><MessageThread messages={data.messages} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Details</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><p><span className="text-muted-foreground">Phone:</span> {c.customer?.phone || "—"}</p><p><span className="text-muted-foreground">Email:</span> {c.customer?.email || "—"}</p><p><span className="text-muted-foreground">Address:</span> {c.customer?.address || "—"}</p><p><span className="text-muted-foreground">Page:</span> <span className="break-all">{c.pageUrl || "—"}</span></p><p><span className="text-muted-foreground">Started:</span> {fmtDate(c.createdAt)}</p><p><span className="text-muted-foreground">Last message:</span> {fmtDate(c.lastMessageAt)}</p></CardContent></Card>
      </div>
    </>
  );
}
