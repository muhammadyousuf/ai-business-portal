"use client";
import Link from "next/link";
import { AccountSettings } from "@/components/account-settings";
import { useUser } from "@/lib/user-context";
export default function AccountPage() { const { me, refresh } = useUser(); return <div className="mx-auto max-w-4xl space-y-6 px-6 py-10"><Link href="/organizations" className="text-xs text-brand hover:underline">← Your organizations</Link><AccountSettings base="/v1/me" account={me} onChange={refresh} /></div>; }
