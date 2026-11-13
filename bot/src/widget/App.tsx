import { useCallback, useEffect, useRef, useState } from "react";
import { BotClient } from "../api/client";
import type { ConvStatus, EmbedOptions, Message, WidgetConfig } from "../types";
import { BotIcon, MinusIcon, SendIcon, SparkIcon, UserIcon } from "./icons";

const toolLabel: Record<string, string> = { answerFromQa: "from the FAQ", getProductPrice: "looked up prices", searchProducts: "searched the catalog", getBranches: "checked branches", getStaff: "checked availability", createOrderRequest: "order request", requestAppointment: "appointment request", createInquiry: "inquiry logged", handoverToHuman: "handed to the team", getBusinessInfo: "business info", fallback: "" };

export function App({ options }: { options: EmbedOptions }) {
  const client = useRef(new BotClient(options.apiBase, options.businessKey)).current;
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [open, setOpen] = useState(!!options.openOnLoad);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ConvStatus>("bot");
  const [quick, setQuick] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [contact, setContact] = useState({ name: "", phone: "", address: "" });
  const endRef = useRef<HTMLDivElement>(null);
  const lastAt = useRef<string | undefined>(undefined);

  useEffect(() => { client.config().then(setConfig).catch(() => setError("Chat is unavailable right now.")); }, [client]);

  const start = useCallback(async () => {
    try {
      const s = await client.start({ branchId: options.branchId });
      setMessages(s.messages); setStatus(s.status); lastAt.current = s.messages.at(-1)?.createdAt;
      setQuick(s.messages.length <= 1 ? config?.widget.quickReplies ?? [] : []);
      setStarted(true);
    } catch (e) { setError((e as Error).message === "disabled" ? "Chat is currently turned off." : "Could not start the chat. Please try again."); }
  }, [client, config, options.branchId]);
  useEffect(() => { if (open && config && !started) void start(); }, [open, config, started, start]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  // Poll for staff replies and status changes while the conversation is open.
  useEffect(() => {
    if (!started || status === "closed") return;
    const id = setInterval(async () => {
      try { const r = await client.poll(lastAt.current); if (r.messages.length) { setMessages((m) => [...m, ...r.messages.filter((x) => !m.some((y) => y.id === x.id))]); lastAt.current = r.messages.at(-1)!.createdAt; if (!open) setUnread((u) => u + r.messages.filter((x) => x.from !== "customer").length); } setStatus(r.status); }
      catch { /* transient */ }
    }, open ? 3000 : 8000);
    return () => clearInterval(id);
  }, [started, status, client, open]);

  async function send(text: string) {
    const t = text.trim(); if (!t || typing) return;
    setInput(""); setQuick([]); setError(null);
    setTyping(true);
    try {
      const r = await client.send(t);
      setMessages((m) => [...m, ...r.messages.filter((x) => !m.some((y) => y.id === x.id))]);
      lastAt.current = r.messages.at(-1)?.createdAt ?? lastAt.current;
      setStatus(r.status);
      if (r.reply?.quickReplies) setQuick(r.reply.quickReplies);
      if (r.reply?.needsContact && config?.widget.collectContact) setContactOpen(true);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "closed") { setStatus("closed"); }
      else if (msg === "expired") { setStarted(false); setMessages([]); await start(); }
      else setError("Message not sent. Please try again.");
    } finally { setTyping(false); }
  }
  async function submitContact(e: React.FormEvent) {
    e.preventDefault(); if (!contact.name || !contact.phone) return;
    setContactOpen(false);
    await send(`${contact.name}, ${contact.phone}${contact.address ? ", " + contact.address : ""}`);
  }
  function startNew() { client.reset(); setStarted(false); setMessages([]); setStatus("bot"); setQuick([]); lastAt.current = undefined; }

  const brand = options.brand ?? config?.business.brand ?? "#4f46e5";
  const name = config?.business.name ?? "Chat";
  const position = options.position ?? config?.widget.position ?? "bottom-right";
  if (config && !config.widget.enabled) return null;
  return (
    <div className={`af ${position === "bottom-left" ? "left" : ""} ${open ? "open" : ""}`} style={{ "--af-brand": brand } as React.CSSProperties}>
      {open ? (
        <div className="af-panel" role="dialog" aria-label={`${name} chat`}>
          <div className="af-head">
            {config?.business.logoUrl ? <img className="af-avatar" src={config.business.logoUrl} alt="" /> : <span className="af-avatar"><BotIcon size={20} /></span>}
            <div style={{ minWidth: 0 }}><div className="af-title">{name}</div><div className="af-sub"><i /> {status === "human" ? "Talking to the team" : status === "needs_human" ? "Waiting for the team" : status === "closed" ? "Conversation closed" : "Replies in seconds"}</div></div>
            <button onClick={() => setOpen(false)} aria-label="Minimise"><MinusIcon /></button>
          </div>
          <div className="af-body">
            {messages.map((m) => m.from === "system" ? <div key={m.id} className="af-sys">{m.text}</div> : (
              <div key={m.id} className={`af-row ${m.from === "customer" ? "me" : ""}`}>
                {m.from !== "customer" ? <span className={`af-dot ${m.from === "staff" ? "staff" : "ai"}`}>{m.from === "staff" ? <UserIcon size={12} /> : <BotIcon size={12} />}</span> : null}
                <div className="af-msg"><div className={`af-bubble ${m.from === "staff" ? "staff" : ""}`}>{m.text}</div>{m.from === "staff" ? <span className="af-tool">{m.authorName || "Team"}</span> : m.meta?.tool && toolLabel[m.meta.tool] ? <span className="af-tool"><SparkIcon /> {toolLabel[m.meta.tool]}</span> : null}</div>
                {m.from === "customer" ? <span className="af-dot me"><UserIcon size={12} /></span> : null}
              </div>
            ))}
            {typing ? <div className="af-row"><span className="af-dot ai"><BotIcon size={12} /></span><span className="af-typing"><i /><i /><i /></span></div> : null}
            <div ref={endRef} />
          </div>
          {error ? <div className="af-error">{error}</div> : null}
          {contactOpen ? (
            <form className="af-contact" onSubmit={submitContact}>
              <p>Your details so the team can confirm:</p>
              <input placeholder="Your name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} required />
              <input placeholder="Phone number" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} required />
              <input placeholder="Address (for delivery, optional)" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
              <div className="af-contact-actions"><button type="button" className="af-link" onClick={() => setContactOpen(false)}>Type it instead</button><button type="submit" className="af-primary">Send</button></div>
            </form>
          ) : null}
          {status === "closed" ? <div className="af-quick"><button onClick={startNew}>Start a new chat</button></div> : quick.length ? <div className="af-quick">{quick.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}</div> : null}
          <form className="af-compose" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={status === "closed" ? "This conversation is closed" : "Type a message…"} aria-label="Message" disabled={status === "closed" || !started} />
            <button type="submit" aria-label="Send" disabled={status === "closed" || !started}><SendIcon /></button>
          </form>
          {config?.widget.poweredBy !== false ? <div className="af-foot">Powered by AssistFlow{config?.widget.humanConfirms ? " · A person confirms every request" : ""}</div> : null}
        </div>
      ) : null}
      <button className="af-launcher" onClick={() => { setOpen((o) => !o); setUnread(0); }} aria-label={open ? "Close chat" : "Open chat"}>
        <BotIcon size={20} /> {open ? "Close" : config?.widget.buttonLabel ?? "Chat with us"}
        {!open && unread ? <span className="af-badge">{unread}</span> : null}
      </button>
    </div>
  );
}
