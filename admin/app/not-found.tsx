import Link from "next/link";
import { Button } from "@assistflow/shared/ui/button";
export default function NotFound() { return <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center"><p className="text-6xl font-semibold text-muted-foreground/40">404</p><h1 className="text-lg font-semibold">Page not found</h1><Button asChild variant="outline"><Link href="/">Back to dashboard</Link></Button></div>; }
