"use client";
import Link from "next/link";
import { Pill, StatusBadge } from "@assistflow/shared/components/pill";
import type { StatusMeta } from "@assistflow/shared/lib/status";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@assistflow/shared/ui/table";
import { Loading, EmptyState, ErrorState, Pagination } from "@assistflow/shared/components/states";
import { relativeTime } from "@assistflow/shared/lib/utils";

export { Pill, StatusBadge, Loading, EmptyState, ErrorState, Pagination, relativeTime, Link };

export interface Col<T> { key: string; label: string; className?: string; render: (row: T) => React.ReactNode }
export function DataTable<T extends { id: string }>({ cols, rows, loading, error, onRetry, empty, page, limit, total, onPage }: { cols: Col<T>[]; rows: T[] | undefined; loading: boolean; error?: string | null; onRetry?: () => void; empty: { title: string; description?: string }; page?: number; limit?: number; total?: number; onPage?: (p: number) => void }) {
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (loading && !rows) return <Loading />;
  if (!rows?.length) return <EmptyState title={empty.title} description={empty.description} />;
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <Table>
        <TableHeader><TableRow className="hover:bg-transparent">{cols.map((c) => <TableHead key={c.key} className={c.className}>{c.label}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{rows.map((r) => <TableRow key={r.id}>{cols.map((c) => <TableCell key={c.key} className={c.className}>{c.render(r)}</TableCell>)}</TableRow>)}</TableBody>
      </Table>
      {page && limit && total !== undefined && onPage ? <Pagination page={page} limit={limit} total={total} onPage={onPage} /> : null}
    </div>
  );
}
export function Status({ value, map }: { value: string; map: Record<string, StatusMeta> }) { return <StatusBadge status={value} map={map} />; }
export const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
export const money = (n: number, cur = "PKR") => `${cur === "PKR" ? "Rs." : cur} ${Number(n).toLocaleString("en-PK")}`;
