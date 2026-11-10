import { cn } from "../lib/utils";

export function MiniBars({
  data,
  format = (v) => String(v),
  className,
  highlightLast = false,
}: {
  data: { label: string; value: number }[];
  format?: (v: number) => string;
  className?: string;
  highlightLast?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={cn("flex h-36 gap-1.5", className)}>
      {data.map((d, i) => (
        <div key={d.label} className="group flex h-full min-w-0 flex-1 flex-col items-center gap-1" title={`${d.label}: ${format(d.value)}`}>
          <span className="text-[10px] tabular text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">{format(d.value)}</span>
          <div className="relative w-full flex-1">
            <div
              className={cn("absolute inset-x-0 bottom-0 rounded-t-sm transition-colors", highlightLast && i === data.length - 1 ? "bg-brand" : "bg-brand/50 group-hover:bg-brand")}
              style={{ height: `${Math.max(3, (d.value / max) * 100)}%` }}
            />
          </div>
          <span className="w-full truncate text-center text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const w = 120, h = 32;
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / Math.max(1, max - min)) * (h - 4) - 2}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-8 w-[120px] text-brand", className)} aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function UsageMeter({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const tone = pct >= 90 ? "bg-destructive" : pct >= 75 ? "bg-warning" : "bg-brand";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular"><span className="font-medium">{used.toLocaleString()}</span> / {limit.toLocaleString()}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
