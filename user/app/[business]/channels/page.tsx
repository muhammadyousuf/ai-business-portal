import { botDemoUrl } from "@/lib/links";
import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { ChannelBadge } from "@assistflow/shared/components/channel-badge";
import { Pill } from "@assistflow/shared/components/pill";
import { channelConnections, notificationLog } from "@assistflow/shared/mock/business";
import { channelLabel } from "@assistflow/shared/lib/status";
import { fmtNum, relativeTime } from "@assistflow/shared/lib/utils";

export default async function ChannelsPage({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params;
  return (
    <>
      <PageHeader title="Channels" description="Where customers can talk to your assistant, and where you get notified." />
      <section className="grid gap-4 md:grid-cols-2">
        {channelConnections.map((c) => (
          <Card key={c.channel} className={c.connected ? "" : "opacity-80"}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div><CardTitle className="flex items-center gap-2"><ChannelBadge channel={c.channel} withLabel={false} /> {channelLabel[c.channel]}</CardTitle><CardDescription>{c.status}</CardDescription></div>
              <Pill tone={c.connected ? "success" : "neutral"}>{c.connected ? "Connected" : "Not connected"}</Pill>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{c.handle ?? "—"} · {fmtNum(c.messages30d)} messages / 30d</span>
              {c.connected ? <Button variant="outline" size="sm">Manage</Button> : <Button size="sm" asChild><Link href={`/${slug}/billing`}>Upgrade to Pro</Link></Button>}
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Website widget</CardTitle><CardDescription>Paste before <code className="font-mono text-xs">&lt;/body&gt;</code>. Colour and greeting come from your settings.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <pre className="overflow-x-auto rounded-lg bg-foreground p-3 text-xs text-background"><code>{`<script src="https://cdn.assistflow.app/widget.js"\n  data-business="karachi-biryani" async></script>`}</code></pre>
            <div className="flex gap-2"><Button size="sm" variant="outline"><Copy /> Copy snippet</Button><Button size="sm" variant="outline" asChild><Link href={botDemoUrl(slug)}><ExternalLink /> Preview on your site</Link></Button></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notification delivery</CardTitle><CardDescription>Failed sends retry 3 times, then show here.</CardDescription></CardHeader>
          <CardContent className="divide-y">
            {notificationLog.map((n) => <div key={n.id} className="flex items-center gap-3 py-2 text-sm"><Pill tone={n.kind === "whatsapp" ? "success" : "info"}>{n.kind}</Pill><div className="min-w-0 flex-1"><p className="truncate">{n.subject}</p><p className="text-[11px] text-muted-foreground">to {n.to} · {relativeTime(n.at)}</p></div><Pill tone={n.status === "delivered" ? "success" : n.status === "failed" ? "destructive" : "neutral"}>{n.status}{n.attempts > 1 ? ` ×${n.attempts}` : ""}</Pill></div>)}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
