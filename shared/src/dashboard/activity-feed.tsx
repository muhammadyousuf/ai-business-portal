import Link from "next/link";
import { BookOpen, Bot, CreditCard, Inbox, ShoppingCart, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { ActivityItem } from "../mock/types";
import { relativeTime } from "../lib/utils";

const kindIcon = { order: ShoppingCart, conversation: Inbox, ai: Bot, billing: CreditCard, system: Zap, knowledge: BookOpen };

export function ActivityFeed({ items, base = "", title = "Recent activity" }: { items: ActivityItem[]; base?: string; title?: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <ol className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
          {items.map((a) => {
            const Icon = kindIcon[a.kind];
            return (
              <li key={a.id} className="relative flex gap-3">
                <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card">
                  <Icon className={`size-3.5 ${a.kind === "ai" ? "text-brand" : "text-muted-foreground"}`} />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{a.actor}</span> <span className="text-muted-foreground">{a.action}</span>{" "}
                    {a.href ? <Link href={`${base}/${a.href}`} className="font-medium hover:underline">{a.target}</Link> : <span className="font-medium">{a.target}</span>}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{relativeTime(a.at)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
