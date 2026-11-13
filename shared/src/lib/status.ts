export type Tone = "neutral" | "brand" | "info" | "success" | "warning" | "destructive";
export interface StatusMeta { label: string; tone: Tone }
const m = (label: string, tone: Tone): StatusMeta => ({ label, tone });

export const conversationStatus: Record<string, StatusMeta> = { bot: m("Assistant", "brand"), needs_human: m("Needs a human", "warning"), human: m("With team", "info"), closed: m("Closed", "neutral") };
export const orderStatus: Record<string, StatusMeta> = { pending: m("Pending", "warning"), confirmed: m("Confirmed", "info"), preparing: m("Preparing", "brand"), ready: m("Ready", "brand"), completed: m("Completed", "success"), cancelled: m("Cancelled", "neutral") };
export const appointmentStatus: Record<string, StatusMeta> = { requested: m("Requested", "warning"), confirmed: m("Confirmed", "info"), completed: m("Completed", "success"), cancelled: m("Cancelled", "neutral"), no_show: m("No show", "destructive") };
export const inquiryStatus: Record<string, StatusMeta> = { new: m("New", "warning"), in_progress: m("In progress", "info"), resolved: m("Resolved", "success"), closed: m("Closed", "neutral") };
export const organizationStatus: Record<string, StatusMeta> = { active: m("Active", "success"), suspended: m("Suspended", "destructive"), deleted: m("Deleted", "neutral") };
export const invitationStatus: Record<string, StatusMeta> = { pending: m("Pending", "info"), accepted: m("Accepted", "success"), expired: m("Expired", "neutral"), revoked: m("Revoked", "neutral") };
export const roleMeta: Record<string, StatusMeta> = { owner: m("Owner", "brand"), member: m("Member", "neutral") };
export const ORDER_FLOW: Record<string, string[]> = { pending: ["confirmed", "cancelled"], confirmed: ["preparing", "ready", "completed", "cancelled"], preparing: ["ready", "completed", "cancelled"], ready: ["completed", "cancelled"], completed: [], cancelled: [] };
export const APPT_FLOW: Record<string, string[]> = { requested: ["confirmed", "cancelled"], confirmed: ["completed", "cancelled", "no_show"], completed: [], cancelled: [], no_show: [] };
export const INQ_FLOW: Record<string, string[]> = { new: ["in_progress", "resolved", "closed"], in_progress: ["resolved", "closed"], resolved: ["closed"], closed: [] };
export const channelLabel: Record<string, string> = { website: "Website", whatsapp: "WhatsApp", messenger: "Messenger", instagram: "Instagram" };
