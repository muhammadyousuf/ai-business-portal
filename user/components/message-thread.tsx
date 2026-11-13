"use client";
import { Bot, UserRound, Zap, Headset } from "lucide-react";
import { cn } from "@assistflow/shared/lib/utils";

export interface Msg { id: string; from: string; text: string; authorName?: string; createdAt: string; meta?: Record<string, unknown> }
export function MessageThread({ messages, compact = false }: { messages: Msg[]; compact?: boolean }) {
  if (!messages.length) return <p className="py-6 text-center text-xs text-muted-foreground">No messages.</p>;
  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {messages.map((m) => {
        if (m.from === "system") return <p key={m.id} className="flex items-center justify-center gap-1.5 py-1 text-center text-[11px] text-muted-foreground"><Zap className="size-3" /> {m.text}</p>;
        const mine = m.from !== "customer";
        return (
          <div key={m.id} className={cn("flex gap-2", mine ? "justify-end" : "justify-start")}>
            {!mine ? <span className="mt-auto flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><UserRound className="size-3" /></span> : null}
            <div className={cn("max-w-[78%] space-y-1", mine && "text-right")}>
              <div className={cn("inline-block whitespace-pre-wrap rounded-2xl px-3 py-2 text-left text-sm leading-relaxed", m.from === "customer" && "rounded-bl-md bg-muted", m.from === "bot" && "rounded-br-md bg-brand text-brand-foreground", m.from === "staff" && "rounded-br-md bg-info-soft")}>{m.text}</div>
              <div className={cn("flex items-center gap-1.5 text-[10px] text-muted-foreground", mine && "justify-end")}>
                {m.from === "bot" ? <><Bot className="size-3 text-brand" /> {m.authorName || "Assistant"}</> : m.from === "staff" ? <><Headset className="size-3" /> {m.authorName}</> : null}
                {m.meta?.tool ? <span className="rounded bg-muted px-1 py-0.5">{String(m.meta.tool)}</span> : null}
                <span>{new Date(m.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
            {mine ? <span className={cn("mt-auto flex size-6 shrink-0 items-center justify-center rounded-full", m.from === "bot" ? "bg-brand-soft text-brand" : "bg-info-soft text-info")}>{m.from === "bot" ? <Bot className="size-3" /> : <Headset className="size-3" />}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
