// Rule-based stand-in for the AI service so the widget works end to end today.
// It follows the same contract the real responder will: every factual answer
// comes from a "tool" over business data, and anything it cannot handle hands
// over to a human. Swap `respond` for the AI provider without touching the API.
import type { BotBusiness } from "./fixtures.js";
import { notifyOwner } from "../notifications/service.js";

export interface SessionState {
  id: string;
  businessId: string;
  stage: "idle" | "awaiting_details" | "done";
  cart: { productId: string; name: string; qty: number; unitPrice: number }[];
  zone?: BotBusiness["zones"][number];
  history: { from: "customer" | "ai" | "system"; text: string; tool?: string; at: string }[];
  orderNumber?: string;
}

export interface BotReply { text: string; tool?: string; quickReplies?: string[]; handover?: boolean; order?: { number: string; total: number } }

const rs = (n: number) => `Rs. ${n.toLocaleString("en-PK")}`;
let orderSeq = 1048;

export async function respond(b: BotBusiness, s: SessionState, raw: string): Promise<BotReply> {
  const text = raw.toLowerCase().trim();
  const has = (...w: string[]) => w.some((x) => text.includes(x));

  if (has("human", "agent", "person", "complaint", "late", "wrong")) {
    await notifyOwner(b.id, { kind: "handover", title: "Customer needs a human", body: raw });
    return { text: "I'll get a person from the team to continue this chat. They'll reply here shortly.", tool: "handoverToHuman", handover: true };
  }
  if (has("start again", "reset")) { s.stage = "idle"; s.cart = []; s.zone = undefined; return { text: "Sure. Ask me about the menu, prices, delivery or timings.", quickReplies: b.quickReplies }; }

  if (s.stage === "awaiting_details") {
    const phone = raw.match(/0?3\d{2}[\s-]?\d{7}/);
    if (phone && raw.length > 12) {
      const subtotal = s.cart.reduce((t, i) => t + i.qty * i.unitPrice, 0);
      const total = subtotal + (s.zone?.charge ?? 0);
      const number = `#${++orderSeq}`;
      s.stage = "done"; s.orderNumber = number;
      const name = raw.split(",")[0].trim().split(" ").slice(0, 2).join(" ");
      await notifyOwner(b.id, { kind: "order", title: `New order request ${number} · ${rs(total)}`, body: raw });
      return { text: `Thank you ${name}. Your order request ${number} has been received. ${b.name} will call you on ${phone[0]} shortly to confirm. Payment is cash on delivery.`, tool: "createOrderRequest", order: { number, total }, quickReplies: ["Can I change the order?", "Start again"] };
    }
    return { text: "Please share your name, phone number and full delivery address in one message, for example: Ali Raza, 0300 1234567, House 12, Street 4, Gulshan-e-Maymar." };
  }
  if (s.stage === "done") return { text: `Your request ${s.orderNumber} is already with the restaurant. For changes, they will confirm on the call, or message them on WhatsApp at ${b.ownerPhone}.`, quickReplies: ["Start again"] };

  // Delivery check
  const zone = b.zones.find((z) => z.aliases.some((a) => text.includes(a)));
  if (has("deliver", "delivery") || zone) {
    if (zone) { s.zone = zone; return { text: `Yes, we deliver to ${zone.name}. Delivery charge is ${rs(zone.charge)} and it usually takes about ${zone.etaMins} minutes.`, tool: "checkDeliveryAvailability", quickReplies: ["How much is chicken biryani?", "What are your timings?"] }; }
    if (has("dha", "clifton", "defence")) { await notifyOwner(b.id, { kind: "handover", title: "Out-of-zone delivery asked", body: raw }); return { text: `Sorry, we do not currently deliver there. Our areas are ${b.zones.map((z) => z.name).join(", ")}. You're welcome to place a pickup order, or I can ask the team about an exception.`, tool: "checkDeliveryAvailability", quickReplies: ["Ask the team", "Start again"] }; }
    return { text: `We deliver to ${b.zones.map((z) => `${z.name} (${rs(z.charge)})`).join(", ")}. Which area are you in?`, tool: "checkDeliveryAvailability" };
  }
  // Hours
  if (has("timing", "open", "close", "hours")) return { text: b.hours, tool: "getBusinessInfo" };

  // Order lines: "2 chicken biryani and 1 raita"
  const lines: SessionState["cart"] = [];
  for (const p of b.products) {
    for (const a of p.aliases) {
      const m = text.match(new RegExp(`(\\d+)\\s*(x|×|plates?|singles?|of)?\\s*(extra\\s+)?${a}`)) ?? text.match(new RegExp(`${a}\\s*(x|×)?\\s*(\\d+)`));
      if (m) { const qty = Number(m[1] ?? m[2] ?? 1); if (p.available && !lines.find((l) => l.productId === p.id)) lines.push({ productId: p.id, name: p.name, qty, unitPrice: p.price }); break; }
    }
  }
  if (lines.length && !has("how much", "price", "kitne")) {
    s.cart = lines; s.stage = "awaiting_details";
    const subtotal = lines.reduce((t, i) => t + i.qty * i.unitPrice, 0);
    const delivery = s.zone?.charge ?? b.zones[0].charge;
    const summary = lines.map((l) => `${l.qty} × ${l.name} (${rs(l.qty * l.unitPrice)})`).join(" and ");
    return { text: `Got it: ${summary}. With ${rs(delivery)} delivery that is ${rs(subtotal + delivery)}, cash on delivery. Please share your name, phone number and full address.`, tool: "createOrderRequest" };
  }
  // Price lookup
  const product = b.products.find((p) => p.aliases.some((a) => text.includes(a)));
  if (product) {
    if (!product.available) return { text: `${product.name} is not available today. ${b.products.filter((p) => p.available && p.id !== product.id).slice(0, 3).map((p) => p.name).join(", ")} are available. Would you like one of those?`, tool: "searchProducts" };
    return { text: `${product.name} is ${rs(product.price)}${product.note ? ". " + product.note : "."}`, tool: "getProductPrice", quickReplies: [`2 ${product.aliases[0]} please`, "Do you deliver to Gulshan-e-Maymar?"] };
  }
  if (has("menu", "what do you have")) return { text: `We have ${b.products.filter((p) => p.available).map((p) => `${p.name} ${rs(p.price)}`).join(", ")}.`, tool: "searchProducts" };
  if (has("pay", "card", "cash")) return { text: "Cash on delivery and bank transfer (details shared on the confirmation call). No card on delivery yet.", tool: "getBusinessInfo" };

  return { text: "I can help with the menu and prices, delivery areas and charges, timings, or taking your order. What would you like to know?", quickReplies: b.quickReplies.concat(["Talk to a person"]) };
}
