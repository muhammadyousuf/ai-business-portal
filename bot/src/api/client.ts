import type { ConvStatus, Message, Reply, WidgetConfig } from "../types";

// Thin client for the backend bot API. The session token is kept per business in localStorage so a
// returning visitor resumes the same conversation (the backend expires sessions after 24h of silence).
export class BotClient {
  private token?: string;
  constructor(private apiBase: string, private businessKey: string) {
    try { this.token = localStorage.getItem(this.storageKey) ?? undefined; } catch { /* storage blocked */ }
  }
  private get storageKey() { return `assistflow:${this.businessKey}:session`; }
  private get base() { return `${this.apiBase}/v1/bot/${encodeURIComponent(this.businessKey)}`; }
  private get headers() { return { "Content-Type": "application/json", ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) }; }

  async config(): Promise<WidgetConfig> {
    const r = await fetch(`${this.base}/config`);
    if (!r.ok) throw new Error(`config ${r.status}`);
    return r.json();
  }
  async start(opts: { branchId?: string } = {}): Promise<{ messages: Message[]; status: ConvStatus; customer: { name: string; phone: string } }> {
    const r = await fetch(`${this.base}/sessions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionToken: this.token, pageUrl: location.href, referrer: document.referrer, branchId: opts.branchId }) });
    if (r.status === 403) throw new Error("disabled");
    if (!r.ok) throw new Error(`session ${r.status}`);
    const data = await r.json();
    this.token = data.sessionToken;
    try { localStorage.setItem(this.storageKey, this.token!); } catch { /* ignore */ }
    return data;
  }
  async send(text: string): Promise<{ reply: Reply | null; messages: Message[]; status: ConvStatus; customer: { name: string; phone: string } }> {
    const r = await fetch(`${this.base}/messages`, { method: "POST", headers: this.headers, body: JSON.stringify({ text }) });
    if (r.status === 401) { this.reset(); throw new Error("expired"); }
    if (r.status === 409) throw new Error("closed");
    if (!r.ok) throw new Error(`message ${r.status}`);
    return r.json();
  }
  async poll(after?: string): Promise<{ messages: Message[]; status: ConvStatus }> {
    const r = await fetch(`${this.base}/messages${after ? `?after=${encodeURIComponent(after)}` : ""}`, { headers: this.headers });
    if (!r.ok) throw new Error(`poll ${r.status}`);
    return r.json();
  }
  async contact(c: { name: string; phone: string; address?: string }) {
    const r = await fetch(`${this.base}/contact`, { method: "POST", headers: this.headers, body: JSON.stringify(c) });
    if (!r.ok) throw new Error(`contact ${r.status}`);
    return r.json();
  }
  reset() { this.token = undefined; try { localStorage.removeItem(this.storageKey); } catch { /* ignore */ } }
}
