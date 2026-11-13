"use client";
import * as React from "react";
import { Label } from "../ui/label";
import { cn } from "../lib/utils";

// Associates the label with the single child control automatically (htmlFor + id) for accessibility and testing.
export function Field({ label, hint, error, htmlFor, children, className, required }: { label: string; hint?: string; error?: string; htmlFor?: string; children: React.ReactNode; className?: string; required?: boolean }) {
  const auto = React.useId();
  const id = htmlFor ?? auto;
  const child = React.isValidElement(children) && !(children.props as { id?: string }).id && typeof children.type !== "string" || (React.isValidElement(children) && typeof children.type === "string" && ["input", "select", "textarea"].includes(children.type))
    ? React.cloneElement(children as React.ReactElement<{ id?: string }>, { id })
    : children;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}{required ? <span className="text-destructive"> *</span> : null}</Label>
      {child}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
export function FormError({ message }: { message?: string | null }) {
  return message ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{message}</div> : null;
}
export function fieldErrors(details?: Record<string, string[]>) { const out: Record<string, string> = {}; for (const [k, v] of Object.entries(details ?? {})) out[k] = v[0]; return out; }
