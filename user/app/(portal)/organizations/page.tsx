"use client";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { BrandMark } from "@assistflow/shared/components/brand-mark";
import { Pill } from "@assistflow/shared/components/pill";
import { useUser } from "@/lib/user-context";

export default function OrganizationsPage() {
  const { me, orgs, signOut } = useUser();
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between"><div><h1 className="text-2xl font-semibold tracking-tight">Your organizations</h1><p className="text-sm text-muted-foreground">Signed in as {me.email}</p></div><Button variant="ghost" size="sm" onClick={() => void signOut()}>Sign out</Button></div>
      {orgs.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center"><p className="font-medium">You are not part of any organization yet</p><p className="mt-1 text-sm text-muted-foreground">Ask the owner to invite you, or create your own organization.</p><Button asChild className="mt-4"><Link href="/signup"><Plus /> Create an organization</Link></Button></div> : (
        <div className="divide-y rounded-xl border bg-card shadow-xs">
          {orgs.map((o) => <Link key={o.uuid} href={`/org/${o.uuid}`} className="group flex items-center gap-3 px-4 py-3 hover:bg-accent/50">{o.logoUrl ? <img src={o.logoUrl} alt="" className="size-10 rounded-lg object-cover" /> : <BrandMark text={o.name.slice(0, 1).toUpperCase()} className="size-10" />}<div className="min-w-0 flex-1"><p className="truncate font-medium">{o.name}</p><p className="text-xs text-muted-foreground">{o.category?.name ?? o.categoryKey}</p></div><Pill tone={o.role === "owner" ? "brand" : "neutral"}>{o.role}</Pill><ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100" /></Link>)}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-muted-foreground"><Link href="/account" className="text-brand hover:underline">Account settings</Link> · <Link href="/notifications" className="text-brand hover:underline">Notifications</Link></p>
    </div>
  );
}
