"use client";
import { AccountSettings } from "@/components/account-settings";
import { useAdmin } from "@/lib/admin-context";
export default function SettingsPage() { const { admin, refresh } = useAdmin(); return <AccountSettings base="/v1/admin/me" account={admin} onChange={refresh} title="Admin account settings" />; }
