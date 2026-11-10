import { cn } from "../lib/utils";

export function BrandMark({ text, className }: { text: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-foreground shadow-xs",
        className,
      )}
      aria-hidden
    >
      {text}
    </div>
  );
}
