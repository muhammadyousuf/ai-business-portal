import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../lib/utils";

export function Loading({ label = "Loading…", className }: { label?: string; className?: string }) {
  return <div className={cn("flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground", className)}><Loader2 className="size-4 animate-spin" /> {label}</div>;
}
export function EmptyState({ icon: Icon, title, description, action, className }: { icon?: React.ComponentType<{ className?: string }>; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center", className)}>
      {Icon ? <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted"><Icon className="size-5 text-muted-foreground" /></div> : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm"><p className="font-medium text-destructive">{message}</p>{onRetry ? <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>Try again</Button> : null}</div>;
}
export function Pagination({ page, limit, total, onPage }: { page: number; limit: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground"><span>Page {page} of {pages} · {total} total</span><div className="flex gap-1"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button></div></div>;
}
