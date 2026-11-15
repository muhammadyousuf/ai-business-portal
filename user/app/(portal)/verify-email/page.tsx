"use client";
import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@assistflow/shared/api/client";
import { Button } from "@assistflow/shared/ui/button";
import { AuthCard } from "@/components/auth-card";
import { useUser } from "@/lib/user-context";

// Landing page for the link in the welcome email (?code=123456). The signed-in user is verified on arrival.
function VerifyInner() {
  const params = useSearchParams(); const { me, refresh } = useUser();
  const code = params.get("code") ?? "";
  const [state, setState] = React.useState<"working" | "done" | "already" | "error">(me.emailVerifiedAt ? "already" : "working"); const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (me.emailVerifiedAt) return;
    if (!/^\d{6}$/.test(code)) { setState("error"); setError("This link is missing a valid code. Enter the code from the email in the banner instead."); return; }
    api.post<{ alreadyVerified: boolean }>("/v1/me/verify-email", { code }).then(async (r) => { setState(r.alreadyVerified ? "already" : "done"); await refresh(); }).catch((e) => { setState("error"); setError(e instanceof ApiError ? e.message : "Could not verify"); });
  }, [code, me.emailVerifiedAt, refresh]);
  return (
    <AuthCard title={state === "done" ? "Email verified" : state === "already" ? "Already verified" : state === "error" ? "Could not verify" : "Verifying…"} subtitle={me.email}>
      {state === "error" ? <p className="text-sm text-destructive">{error}</p> : state === "working" ? <p className="text-sm text-muted-foreground">One moment.</p> : <p className="text-sm text-muted-foreground">Thanks, your email address is confirmed.</p>}
      <Button asChild className="w-full"><Link href="/organizations">Continue to your organizations</Link></Button>
    </AuthCard>
  );
}
export default function VerifyEmailPage() { return <React.Suspense><VerifyInner /></React.Suspense>; }
