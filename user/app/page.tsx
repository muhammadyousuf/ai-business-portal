import Link from "next/link";
import { Bot, Check, Globe, Inbox, MessageCircle, ShieldCheck, ShoppingCart, Store } from "lucide-react";
import { InstagramIcon, MessengerIcon } from "@assistflow/shared/components/brand-icons";
import { Button } from "@assistflow/shared/ui/button";
import { BrandMark } from "@assistflow/shared/components/brand-mark";
import { PRODUCT_NAME, plans } from "@assistflow/shared/mock/platform";
import { fmtUsd } from "@assistflow/shared/lib/utils";

const industries = [
  ["Restaurants", "Menu, delivery zones, order requests"], ["Bakeries", "Cake sizes, customisation, advance booking"], ["Schools", "Admissions, fees, documents, campus visits"],
  ["Clinics", "Doctor timings, appointment requests"], ["Ecommerce", "Sizes, stock, shipping, order collection"], ["Electrical & wholesale", "Specs, brands, stock, bulk quotations"],
];

export default function Landing() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2"><BrandMark text="A" /><span className="font-semibold">{PRODUCT_NAME}</span><span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">placeholder name</span></div>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex"><a href="#how" className="hover:text-foreground">How it works</a><a href="#industries" className="hover:text-foreground">Industries</a><a href="#pricing" className="hover:text-foreground">Pricing</a><Link href="/sign-in" className="hover:text-foreground">Sign in</Link></nav>
        <Button asChild size="sm"><Link href="/sign-in">Start free trial</Link></Button>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 text-center">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground"><Bot className="size-3.5 text-brand" /> An AI employee for customer inquiries, orders and bookings</p>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">Never miss a customer inquiry, order or booking again.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">Connect your website, WhatsApp, Messenger and Instagram. Add your menu, prices, FAQs and delivery areas. The assistant answers in seconds, collects the order, and notifies you to confirm.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Globe className="size-4" /> Website</span><span className="inline-flex items-center gap-1.5"><MessageCircle className="size-4" /> WhatsApp</span><span className="inline-flex items-center gap-1.5"><MessengerIcon className="size-4" /> Messenger</span><span className="inline-flex items-center gap-1.5"><InstagramIcon className="size-4" /> Instagram</span></div>
      </section>

      <section id="how" className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-14 md:grid-cols-4">
          {[[Store, "1. Add your business", "Menu or products, prices, FAQs, delivery zones and opening hours. No developer needed."], [Bot, "2. Assistant answers", "Prices and availability come from your data, never guessed. Unknown questions go to a human."], [ShoppingCart, "3. Collects the request", "Name, phone, address and items. You get WhatsApp and email instantly."], [Inbox, "4. You confirm", "Call the customer, confirm in one tap. Every conversation lives in one inbox."]].map(([Icon, t, d]) => {
            const I = Icon as typeof Store;
            return <div key={t as string}><span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand"><I className="size-5" /></span><h3 className="mt-3 font-semibold">{t as string}</h3><p className="mt-1 text-sm text-muted-foreground">{d as string}</p></div>;
          })}
        </div>
      </section>

      <section id="industries" className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">One platform, configured per industry</h2>
        <p className="mt-1 text-muted-foreground">Same core, different knowledge and actions.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{industries.map(([n, d]) => <div key={n} className="rounded-xl border bg-card p-4"><p className="font-medium">{n}</p><p className="text-sm text-muted-foreground">{d}</p></div>)}</div>
      </section>

      <section id="pricing" className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">Simple monthly pricing</h2>
          <p className="mt-1 text-muted-foreground">Limits keep costs predictable for both of us. PKR plans available for Pakistan.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {plans.map((p) => <div key={p.key} className={`rounded-xl border p-5 ${p.highlight ? "border-brand ring-1 ring-brand/30" : ""}`}><p className="font-semibold">{p.name}</p><p className="mt-1 text-3xl font-semibold tabular">{fmtUsd(p.monthlyUsd)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p><p className="text-xs text-muted-foreground">{p.aiReplies.toLocaleString()} AI replies · {p.channels} channel{p.channels > 1 ? "s" : ""}</p><ul className="mt-4 space-y-1.5">{p.features.slice(0, 4).map((f) => <li key={f} className="flex items-start gap-2 text-xs"><Check className="mt-0.5 size-3 shrink-0 text-success" />{f}</li>)}</ul><Button className="mt-5 w-full" variant={p.highlight ? "default" : "outline"} asChild><Link href="/sign-in">Start trial</Link></Button></div>)}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Every business&apos;s data is isolated. Humans confirm every order.</span>
        <span>Demo build with synthetic data · {PRODUCT_NAME}</span>
      </footer>
    </div>
  );
}
