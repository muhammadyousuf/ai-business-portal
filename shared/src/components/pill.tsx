import { Badge } from "../ui/badge";
import type { StatusMeta, Tone } from "../lib/status";

const toneToVariant = { neutral: "secondary", brand: "brand", info: "info", success: "success", warning: "warning", destructive: "destructive" } as const;

export function Pill({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <Badge variant={toneToVariant[tone]} className={className}>{children}</Badge>;
}

export function StatusBadge({ status, map }: { status: string; map: Record<string, StatusMeta> }) {
  const meta = map[status] ?? { label: status, tone: "neutral" as Tone };
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}
