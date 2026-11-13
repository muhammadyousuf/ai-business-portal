import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <span className="relative block">
    <select ref={ref} className={cn("flex h-9 w-full appearance-none rounded-md border border-input bg-card px-3 pr-8 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50", className)} {...props}>{children}</select>
    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
  </span>
));
Select.displayName = "Select";
