import Link from "next/link";
import { BrandMark } from "@assistflow/shared/components/brand-mark";
export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <Link href="/login" className="mb-8 flex items-center gap-2.5"><BrandMark text="A" /><span className="text-sm font-semibold">AssistFlow Admin</span></Link>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        <div className="mt-6 space-y-4">{children}</div>
        {footer ? <div className="mt-6 text-center text-xs text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}
