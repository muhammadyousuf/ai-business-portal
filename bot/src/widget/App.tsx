import { useEffect, useRef, useState } from "react";
import { BotClient } from "../api/client";
import type { EmbedOptions, Message, WidgetConfig } from "../types";
import { BotIcon, MinusIcon, SendIcon, SparkIcon, UserIcon } from "./icons";

const toolLabel: Record<string, string> = {
  checkDeliveryAvailability: "checked delivery zones", getProductPrice: "looked up menu price", searchProducts: "searched the menu",
  createOrderRequest: "created order request · owner notified", handoverToHuman: "handed over to a person", getBusinessInfo: "checked business info",
};

export function App({ options }: { options: EmbedOptions }) {
  const client = useRef(new BotClient(options.apiBase, options.businessKey)).current;
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [open, setOpen] = useState(!!options.openOnLoad);
  const [messages, setMessages] = useState<Message[]>([]);
  const [quick, setQuick] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { client.config().then(setConfig).catch(() => setError("Chat is unavailable right now.")); }, [client]);
  useEffect(() => {
    if (!open || messages.length) return;
    client.start().then((m) => { setMessages(m); setQuick(config?.widget.quickReplies ?? []); }).catch(() => setError("Could not start the chat."));
  }, [open, config, client, messages.length]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || typing) return;
    setInput(""); setQuick([]); setError(null);
    setMessages((m) => [...m, { from: "customer", text: t, at: new Date().toISOString() }]);
    setTyping(true);
    try {
      const { reply, messages: tail } = await client.send(t);
      const incoming = tail.filter((x) => x.from !== "customer");
      setMessages((m) => [...m, ...incoming]);
      setQuick(reply.quickReplies ?? []);
      if (!open) setUnread((u) => u + 1);
    } catch { setError("Message not sent. Please try again."); }
    finally { setTyping(false); }
  }

  const brand = options.brand ?? config?.business.brand ?? "#4f46e5";
  const name = config?.business.name ?? "Assistant";
  return (
    <div className={`af ${options.position === "bottom-left" ? "left" : ""} ${open ? "open" : ""}`} style={{ "--af-brand": brand } as React.CSSProperties}>
      {open ? (
        <div className="af-panel" role="dialog" aria-label={`${name} chat`}>
          <div className="af-head">
            <span className="af-avatar"><BotIcon size={20} /></span>
            <div style={{ minWidth: 0 }}><div className="af-title">{name}</div><div className="af-sub"><i /> Replies in seconds · 24/7</div></div>
            <button onClick={() => setOpen(false)} aria-label="Minimise"><MinusIcon /></button>
          </div>
          <div className="af-body">
            {messages.map((m, i) => m.from === "system" ? <div key={i} className="af-sys">{m.text}</div> : (
              <div key={i} className={`af-row ${m.from === "customer" ? "me" : ""}`}>
                {m.from !== "customer" ? <span className="af-dot ai"><BotIcon size={12} /></span> : null}
                <div className="af-msg"><div className="af-bubble">{m.text}</div>{m.tool ? <span className="af-tool"><SparkIcon /> {toolLabel[m.tool] ?? m.tool}</span> : null}</div>
                {m.from === "customer" ? <span className="af-dot me"><UserIcon size={12} /></span> : null}
              </div>
            ))}
            {typing ? <div className="af-row"><span className="af-dot ai"><BotIcon size={12} /></span><span className="af-typing"><i /><i /><i /></span></div> : null}
            <div ref={endRef} />
          </div>
          {error ? <div className="af-error">{error}</div> : null}
          {quick.length ? <div className="af-quick">{quick.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}</div> : null}
          <form className="af-compose" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…" aria-label="Message" />
            <button type="submit" aria-label="Send"><SendIcon /></button>
          </form>
          {config?.widget.poweredBy !== false ? <div className="af-foot">Powered by AssistFlow{config?.widget.humanConfirms ? " · A human will confirm your order" : ""}</div> : null}
        </div>
      ) : null}
      <button className="af-launcher" onClick={() => { setOpen((o) => !o); setUnread(0); }} aria-label={open ? "Close chat" : "Open chat"}>
        <BotIcon size={20} /> {open ? "Close" : config?.widget.buttonLabel ?? "Chat with us"}
        {!open && unread ? <span className="af-badge">{unread}</span> : null}
      </button>
    </div>
  );
}
