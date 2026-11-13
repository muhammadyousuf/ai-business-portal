export interface WidgetConfig {
  business: { name: string; logoText: string; logoUrl: string; brand: string; locale: string };
  widget: { enabled: boolean; greeting: string; quickReplies: string[]; position: "bottom-right" | "bottom-left"; buttonLabel: string; poweredBy: boolean; collectContact: boolean; humanConfirms: boolean; assistantName: string; branches: { id: string; name: string }[] };
}
export interface Message { id: string; from: "customer" | "bot" | "staff" | "system"; text: string; authorName?: string; createdAt: string; meta?: { tool?: string; handover?: boolean; created?: { kind: string; number: number } } }
export interface Reply { text: string; tool?: string; quickReplies?: string[]; needsContact?: boolean; handover?: boolean; created?: { kind: "order" | "appointment" | "inquiry"; id: string; number: number } }
export type ConvStatus = "bot" | "needs_human" | "human" | "closed";
export interface EmbedOptions { businessKey: string; apiBase: string; position?: "bottom-right" | "bottom-left"; openOnLoad?: boolean; brand?: string; branchId?: string }
