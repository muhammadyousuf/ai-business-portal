"use client";
import * as React from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", destructive, typeToConfirm, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; confirmLabel?: string; destructive?: boolean; typeToConfirm?: string; onConfirm: () => Promise<void> | void }) {
  const [typed, setTyped] = React.useState(""); const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { if (!open) setTyped(""); }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description} size="sm">
        {typeToConfirm ? <div className="mb-4 space-y-1.5"><p className="text-xs text-muted-foreground">Type <span className="font-mono font-semibold text-foreground">{typeToConfirm}</span> to confirm.</p><Input value={typed} onChange={(e) => setTyped(e.target.value)} /></div> : null}
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button><Button variant={destructive ? "destructive" : "default"} disabled={busy || (!!typeToConfirm && typed !== typeToConfirm)} onClick={async () => { setBusy(true); try { await onConfirm(); onOpenChange(false); } finally { setBusy(false); } }}>{busy ? "Working…" : confirmLabel}</Button></div>
      </DialogContent>
    </Dialog>
  );
}
