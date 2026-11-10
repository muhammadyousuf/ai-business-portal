// Tiny inline icons so the bundle has no icon dependency.
const base = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export const BotIcon = (p: { size?: number }) => <svg {...base} width={p.size ?? 16} height={p.size ?? 16}><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2M20 14h2M15 13v2M9 13v2" /></svg>;
export const UserIcon = (p: { size?: number }) => <svg {...base} width={p.size ?? 16} height={p.size ?? 16}><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>;
export const SendIcon = () => <svg {...base}><path d="m3 3 3 9-3 9 19-9Z" /><path d="M6 12h16" /></svg>;
export const MinusIcon = () => <svg {...base}><path d="M5 12h14" /></svg>;
export const SparkIcon = () => <svg {...base} width={11} height={11}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></svg>;
