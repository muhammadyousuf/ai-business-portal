"use client";
import { UserProvider } from "@/lib/user-context";
import { VerifyEmailBanner } from "@/components/verify-email-banner";
export default function PortalLayout({ children }: { children: React.ReactNode }) { return <UserProvider><VerifyEmailBanner />{children}</UserProvider>; }
