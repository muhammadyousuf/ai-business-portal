import { Bot, UserRound, Wrench, Zap } from "lucide-react";
import type { Message } from "@assistflow/shared/mock/types";
import { cn } from "@assistflow/shared/lib/utils";

const toolLabel: Record<string, string> = {
  getProductPrice: "Looked up price in catalog", checkDeliveryAvailability: "Checked delivery zones", createOrderRequest: "Created order request",
  searchProducts: "Searched catalog", handoverToHuman: "Handed over to staff", requestAppointment: "Requested appointment",
};

export function ConversationThread({ messages, compact = false }: { messages: Message[]; compact?: boolean }) {
  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {messages.map((m) => {
        if (m.from === "system") {
          return <p key={m.id} className="flex items-center justify-center gap-1.5 py-1 text-center text-[11px] text-muted-foreground"><Zap className="size-3" /> {m.text}</p>;
        }
        const mine = m.from !== "customer";
        return (
          <div key={m.id} className={cn("flex gap-2", mine ? "justify-end" : "justify-start")}>
            {!mine ? <span className="mt-auto flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><UserRound className="size-3" /></span> : null}
            <div className={cn("max-w-[78%] space-y-1", mine && "items-end text-right")}>
              <div className={cn("inline-block rounded-2xl px-3 py-2 text-left text-sm leading-relaxed", m.from === "customer" && "rounded-bl-md bg-muted", m.from === "ai" && "rounded-br-md bg-brand text-brand-foreground", m.from === "staff" && "rounded-br-md bg-info-soft")}>
                {m.text}
              </div>
              <div className={cn("flex items-center gap-1.5 text-[10px] text-muted-foreground", mine && "justify-end")}>
                {m.from === "ai" ? <><Bot className="size-3 text-brand" /> AI</> : m.from === "staff" ? <><UserRound className="size-3" /> {m.staffName}</> : null}
                {m.tool ? <span className="inline-flex items-center gap-1 rounded bg-muted px-1 py-0.5"><Wrench className="size-2.5" /> {toolLabel[m.tool] ?? m.tool}</span> : null}
                <span>{new Date(m.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
            {m.from === "ai" ? <span className="mt-auto flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"><Bot className="size-3" /></span> : null}
          </div>
        );
      })}
    </div>
  );
}
