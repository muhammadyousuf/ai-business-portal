import { z } from "zod";
export const pageQuery = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(25) });
export type PageQuery = z.infer<typeof pageQuery>;
export const paged = <T>(items: T[], total: number, q: PageQuery) => ({ items, page: q.page, limit: q.limit, total });
export const skip = (q: PageQuery) => (q.page - 1) * q.limit;
