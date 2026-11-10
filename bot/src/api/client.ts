import type { Message, Reply, WidgetConfig } from "../types";

// Thin client for the backend bot API. Session token is kept per business in localStorage
// so a returning visitor resumes their conversation.
export class BotClient {
  private token?: string;
  sessionId?: string;
  constructor(private apiBase: string, private businessKey: string) {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) { const { sessionId, token } = JSON.parse(saved); this.sessionId = sessionId; this.token = token; }
  }
  private get storageKey() { return `assistflow:${this.businessKey}:session`; }
  private get base() { return `${this.apiBase}/v1/bot/${encodeURIComponent(this.businessKey)}`; }

  async config(): Promise<WidgetConfig> {
    const r = await fetch(`${this.base}/config`);
    if (!r.ok) throw new Error(`config ${r.status}`);
    return r.json();
  }
  async start(): Promise<Message[]> {
    const r = await fetch(`${this.base}/sessions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: this.sessionId, pageUrl: location.href, referrer: document.referrer }) });
    if (!r.ok) throw new Error(`session ${r.status}`);
    const data = (await r.json()) as { sessionId: string; token: string; messages: Message[] };
    this.sessionId = data.sessionId; this.token = data.token;
    localStorage.setItem(this.storageKey, JSON.stringify({ sessionId: this.sessionId, token: this.token }));
    return data.messages;
  }
  async send(text: string): Promise<{ reply: Reply; messages: Message[] }> {
    const r = await fetch(`${this.base}/messages`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.token}` }, body: JSON.stringify({ sessionId: this.sessionId, text }) });
    if (r.status === 401) { localStorage.removeItem(this.storageKey); this.sessionId = undefined; await this.start(); return this.send(text); }
    if (!r.ok) throw new Error(`message ${r.status}`);
    return r.json();
  }
  reset() { localStorage.removeItem(this.storageKey); this.sessionId = undefined; this.token = undefined; }
}
