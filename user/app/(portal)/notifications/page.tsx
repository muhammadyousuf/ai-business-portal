"use client";
import Link from "next/link";
import { NotificationsPage } from "@/components/notifications-page";
export default function Page() { return <div className="mx-auto max-w-3xl space-y-6 px-6 py-10"><Link href="/organizations" className="text-xs text-brand hover:underline">← Your organizations</Link><NotificationsPage base="/v1/me" linkPrefix="/org" /></div>; }
