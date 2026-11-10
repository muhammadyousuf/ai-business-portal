import { botDemoUrl, adminUrl } from "@/lib/links";
import Link from "next/link";
import { Bot, Mail, ShieldCheck, Store } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Label } from "@assistflow/shared/ui/label";
import { BrandMark } from "@assistflow/shared/components/brand-mark";
import { PRODUCT_NAME } from "@assistflow/shared/mock/platform";

export default function SignInPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-between p-8 lg:p-12">
        <Link href="/" className="flex items-center gap-2.5"><BrandMark text="A" /><span className="text-sm font-semibold">{PRODUCT_NAME}</span></Link>
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="space-y-1.5"><h1 className="text-2xl font-semibold tracking-tight">Sign in</h1><p className="text-sm text-muted-foreground">We will email you a one-time link. No password to remember.</p></div>
          <form className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="you@yourbusiness.com" autoComplete="email" /></div>
            <Button className="w-full" type="button" asChild><Link href="/karachi-biryani"><Mail /> Email me a sign-in link</Link></Button>
          </form>
          <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
          <div className="grid gap-2">
            <Button variant="outline" className="w-full justify-start" asChild><Link href="/karachi-biryani"><Store /> Open demo business portal (Karachi Biryani House)</Link></Button>
            <Button variant="outline" className="w-full justify-start" asChild><Link href={adminUrl()}><ShieldCheck /> Open platform admin portal</Link></Button>
            <Button variant="outline" className="w-full justify-start" asChild><Link href={botDemoUrl("karachi-biryani")}><Bot /> Try the customer chat widget</Link></Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">New business? <Link href="/" className="font-medium text-brand hover:underline">Start a 14-day trial</Link></p>
        </div>
        <p className="text-xs text-muted-foreground">Demo build. All buttons open sample data; nothing is sent.</p>
      </div>
      <div className="relative hidden overflow-hidden bg-brand p-12 text-brand-foreground lg:flex lg:flex-col lg:justify-end">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="absolute -right-24 -top-24 size-96 rounded-full border border-white/10" /><div className="absolute -right-10 top-10 size-96 rounded-full border border-white/10" />
        <div className="relative space-y-6">
          <blockquote className="text-2xl font-medium leading-snug tracking-tight">&ldquo;Customers used to wait 25 minutes for a reply on WhatsApp. Now they get prices and delivery info in 4 seconds, and I just confirm the order.&rdquo;</blockquote>
          <p className="text-sm opacity-85">Imran Siddiqui, Karachi Biryani House (demo)</p>
        </div>
      </div>
    </div>
  );
}
