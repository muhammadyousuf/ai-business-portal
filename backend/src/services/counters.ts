import { Counter } from "../models/index.js";
export async function nextNumber(orgId: string, kind: "order" | "appointment" | "inquiry") {
  const c = await Counter.findOneAndUpdate({ key: `${orgId}:${kind}` }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return c.seq;
}
