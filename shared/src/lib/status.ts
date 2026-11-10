export type Tone = "neutral" | "brand" | "info" | "success" | "warning" | "destructive";
export interface StatusMeta { label: string; tone: Tone }

const m = (label: string, tone: Tone): StatusMeta => ({ label, tone });

export const orderStatus: Record<string, StatusMeta> = {
  pending: m("Pending confirmation", "warning"), confirmed: m("Confirmed", "info"), preparing: m("Preparing", "brand"),
  out_for_delivery: m("Out for delivery", "brand"), completed: m("Completed", "success"), cancelled: m("Cancelled", "neutral"),
};
export const conversationStatus: Record<string, StatusMeta> = {
  ai: m("AI handling", "brand"), human: m("With staff", "info"), resolved: m("Resolved", "success"), needs_attention: m("Needs attention", "warning"),
};
export const businessStatus: Record<string, StatusMeta> = {
  active: m("Active", "success"), trial: m("Trial", "info"), suspended: m("Suspended", "destructive"), cancelled: m("Cancelled", "neutral"),
};
export const invoiceStatus: Record<string, StatusMeta> = {
  paid: m("Paid", "success"), due: m("Due", "info"), overdue: m("Overdue", "destructive"), void: m("Void", "neutral"),
};
export const paymentStatus: Record<string, StatusMeta> = {
  paid: m("Paid", "success"), pending: m("Pending", "info"), failed: m("Failed", "destructive"), refunded: m("Refunded", "neutral"),
};
export const ticketStatus: Record<string, StatusMeta> = {
  open: m("Open", "warning"), waiting: m("Waiting on customer", "info"), resolved: m("Resolved", "success"),
};
export const channelLabel: Record<string, string> = { website: "Website", whatsapp: "WhatsApp", messenger: "Messenger", instagram: "Instagram" };
