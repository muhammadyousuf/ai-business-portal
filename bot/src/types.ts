export interface WidgetConfig {
  business: { name: string; logoText: string; brand: string; locale: string };
  widget: { greeting: string; quickReplies: string[]; position: "bottom-right" | "bottom-left"; buttonLabel: string; poweredBy: boolean; humanConfirms: boolean };
}
export interface Message { from: "customer" | "ai" | "system" | "staff"; text: string; tool?: string; at: string }
export interface Reply { text: string; tool?: string; quickReplies?: string[]; handover?: boolean; order?: { number: string; total: number } }
export interface EmbedOptions { businessKey: string; apiBase: string; position?: "bottom-right" | "bottom-left"; openOnLoad?: boolean; brand?: string }
