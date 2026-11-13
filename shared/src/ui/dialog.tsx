"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { title: string; description?: string; size?: "sm" | "md" | "lg" }>(
  ({ className, children, title, description, size = "md", ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content ref={ref} className={cn("fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-5 shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95", size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-lg", className)} {...props}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div><DialogPrimitive.Title className="text-base font-semibold">{title}</DialogPrimitive.Title>{description ? <DialogPrimitive.Description className="mt-1 text-xs text-muted-foreground">{description}</DialogPrimitive.Description> : <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>}</div>
          <DialogPrimitive.Close className="rounded-md p-1 text-muted-foreground hover:bg-accent" aria-label="Close"><X className="size-4" /></DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
);
DialogContent.displayName = "DialogContent";
export { Dialog, DialogTrigger, DialogClose, DialogContent };
