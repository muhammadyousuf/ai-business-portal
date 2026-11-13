import Link from "next/link";
import { Bot, Check, Inbox, ShieldCheck, ShoppingCart, Store } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { BrandMark } from "@assistflow/shared/components/brand-mark";

const industries = [["Restaurants", "Menus, prices, branches, order requests"], ["Hospitals & clinics", "Doctors, schedules, fees, appointment requests"], ["Salons", "Services, staff availability, bookings"], ["Gyms", "Membership plans, trainers, inquiries"], ["Schools", "Programs, teachers, admission inquiries"], ["Any business", "Categories are added by the platform, no code needed"]];

export default function Landing() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><div className="flex items-center gap-2"><BrandMark text="A" /><span className="font-semibold">AssistFlow</span></div><nav className="flex items-center gap-3 text-sm"><Link href="/login" className="text-muted-foreground hover:text-foreground">Sign in</Link><Button asChild size="sm"><Link href="/signup">Create your organization</Link></Button></nav></header>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 text-center">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground"><Bot className="size-3.5 text-brand" /> A chatbot that knows your business</p>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">Answer customers, take orders and bookings, right on your website.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">Add your menu, services, branches and common questions. Paste one line on your site. The assistant answers 24/7, collects orders and appointments, and your team takes over whenever they want.</p>
        <div className="mt-7 flex justify-center gap-3"><Button size="lg" asChild><Link href="/signup">Get started free</Link></Button><Button size="lg" variant="outline" asChild><Link href="/login">Sign in</Link></Button></div>
      </section>
      <section className="border-y bg-card"><div className="mx-auto grid max-w-6xl gap-6 px-6 py-14 md:grid-cols-4">
        {[[Store, "Set up your organization", "Profile, branches, menu or services, staff and FAQs."], [Bot, "Install the chatbot", "One script tag. Works on WordPress, Shopify, Wix or any site."], [ShoppingCart, "Collect orders and bookings", "The assistant takes details and your team confirms."], [Inbox, "One inbox for your team", "Reply manually, take over from the bot, close conversations."]].map(([Icon, t, d]) => { const I = Icon as typeof Store; return <div key={t as string}><span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand"><I className="size-5" /></span><h3 className="mt-3 font-semibold">{t as string}</h3><p className="mt-1 text-sm text-muted-foreground">{d as string}</p></div>; })}
      </div></section>
      <section className="mx-auto max-w-6xl px-6 py-14"><h2 className="text-2xl font-semibold tracking-tight">Built for every kind of business</h2><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{industries.map(([n, d]) => <div key={n} className="rounded-xl border bg-card p-4"><p className="font-medium">{n}</p><p className="text-sm text-muted-foreground">{d}</p></div>)}</div></section>
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Each organization&apos;s data is isolated. Your team confirms every order.</span><span className="inline-flex items-center gap-1.5"><Check className="size-3.5" /> Free during Phase 1</span></footer>
    </div>
  );
}
