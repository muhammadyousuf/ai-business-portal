import { Card } from "../ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: LucideIcon;
  tone?: "default" | "brand" | "warning";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-md",
            tone === "brand" && "bg-brand-soft text-brand",
            tone === "warning" && "bg-warning-soft text-warning",
            tone === "default" && "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular tracking-tight">{value}</p>
      {delta ? <p className="mt-1 text-xs text-muted-foreground">{delta}</p> : null}
    </Card>
  );
}
