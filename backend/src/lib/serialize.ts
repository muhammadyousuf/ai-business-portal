// Normalises mongoose docs and lean objects to plain JSON with `id`.
export function toJSON<T = Record<string, unknown>>(d: unknown): T {
  if (d && typeof (d as { toJSON?: unknown }).toJSON === "function") return (d as { toJSON: () => T }).toJSON();
  const o = { ...(d as Record<string, unknown>) };
  if (o._id !== undefined) { o.id = String(o._id); delete o._id; }
  return o as T;
}
export const toJSONList = <T = Record<string, unknown>>(ds: unknown[]) => ds.map((d) => toJSON<T>(d));
