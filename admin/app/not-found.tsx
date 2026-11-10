import Link from "next/link";
import { Button } from "@assistflow/shared/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-6xl font-semibold tabular text-muted-foreground/40">404</p>
      <h1 className="text-lg font-semibold">Nothing here, or not yours to see</h1>
      <p className="max-w-sm text-sm text-muted-foreground">Every business&apos;s data is isolated. If you expected to find something, check the address or ask support.</p>
      <Button asChild variant="outline"><Link href="/">Back to home</Link></Button>
    </div>
  );
}
