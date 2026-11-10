// Tools the assistant may call. Each one is executed server-side with the
// business pinned, so the model can only read this business's data.
export const BOT_TOOLS = [
  "searchProducts",
  "getProductPrice",
  "checkDeliveryAvailability",
  "calculateDeliveryCharges",
  "createOrderRequest",
  "requestAppointment",
  "handoverToHuman",
] as const;
export type BotTool = (typeof BOT_TOOLS)[number];
