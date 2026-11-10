import { log } from "../../lib/logger.js";

// Owner notifications on new order requests and handovers. Real
// implementation: Resend email + WhatsApp Cloud API template, each with a
// delivery log row and 3 retries (notifications collection).
export async function notifyOwner(businessId: string, event: { kind: "order" | "handover"; title: string; body: string }) {
  log.info("notify owner (stub)", { businessId, ...event });
  return { email: "queued", whatsapp: "queued" } as const;
}
