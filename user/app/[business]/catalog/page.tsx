import { Download, Plus, Upload } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Input } from "@assistflow/shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@assistflow/shared/ui/table";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Pill } from "@assistflow/shared/components/pill";
import { categories, fmtPKR, products } from "@assistflow/shared/mock/business";

function Toggle({ on }: { on: boolean }) {
  return <span role="switch" aria-checked={on} className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full ${on ? "bg-brand" : "bg-muted-foreground/30"}`}><span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} /></span>;
}

export default function CatalogPage() {
  return (
    <>
      <PageHeader title="Menu & products" description="The assistant quotes only these prices. Change a price here and every channel updates instantly." actions={<><Button variant="outline" size="sm"><Upload /> Import CSV</Button><Button variant="outline" size="sm"><Download /> Export</Button><Button size="sm"><Plus /> Add item</Button></>} />
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-3">
          <div className="flex flex-wrap items-center gap-2"><Input placeholder="Search items…" className="h-8 w-56" />{categories.map((c) => <Button key={c.id} variant="outline" size="sm">{c.name}</Button>)}</div>
          {categories.map((cat) => (
            <div key={cat.id} className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex items-center justify-between border-b px-4 py-2.5"><h2 className="text-sm font-semibold">{cat.name}</h2><span className="text-xs text-muted-foreground">{products.filter((p) => p.categoryId === cat.id).length} items</span></div>
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-4">Item</TableHead><TableHead className="hidden md:table-cell">Options</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Available</TableHead></TableRow></TableHeader>
                <TableBody>
                  {products.filter((p) => p.categoryId === cat.id).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="pl-4"><p className="font-medium">{p.name}{p.popular ? <Pill tone="warning" className="ml-2">Popular</Pill> : null}</p>{p.description ? <p className="text-xs text-muted-foreground">{p.description}</p> : null}</TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{p.options ? p.options.map((o) => `${o.name}: ${o.choices.map((c) => c.label + (c.delta ? ` +${fmtPKR(c.delta)}` : "")).join(" / ")}`).join("; ") : "—"}</TableCell>
                      <TableCell className="text-right"><Input defaultValue={p.price} className="ml-auto h-7 w-24 text-right tabular" /></TableCell>
                      <TableCell className="text-right"><Toggle on={p.available} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
        <aside className="space-y-4">
          <Card><CardHeader><CardTitle>How the assistant uses this</CardTitle></CardHeader><CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>Customer: &ldquo;How much is karahi?&rdquo;</p><p className="rounded bg-muted p-2 text-foreground">Calls <code className="font-mono">getProductPrice(&quot;karahi&quot;)</code> → Chicken Karahi half kg Rs. 1,450, full kg Rs. 2,750.</p>
            <p>Unavailable items are mentioned as unavailable, never quoted. Out-of-catalog items trigger a handover.</p>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Quick actions</CardTitle><CardDescription>Owner-only.</CardDescription></CardHeader><CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">Mark whole category unavailable</Button>
            <Button variant="outline" size="sm" className="w-full justify-start">Apply Friday deal (−10% biryani)</Button>
            <Button variant="outline" size="sm" className="w-full justify-start">Schedule price change</Button>
          </CardContent></Card>
        </aside>
      </div>
    </>
  );
}
