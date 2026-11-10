import type { AuditEntry, Business, Invoice, Payment, Plan, PlatformUser, Ticket, UsageDay } from "./types";

export const PRODUCT_NAME = "AssistFlow"; // placeholder product name, see README
export const PRODUCT_DOMAIN = "assistflow.app";

export const plans: Plan[] = [
  { key: "starter", name: "Starter", monthlyUsd: 19, aiReplies: 300, channels: 1, staffSeats: 1, features: ["Website chat widget", "FAQs and business info", "Order and inquiry requests", "Email notifications"] },
  { key: "growth", name: "Growth", monthlyUsd: 49, aiReplies: 1000, channels: 2, staffSeats: 3, features: ["Everything in Starter", "WhatsApp channel", "Customer CRM", "Human handover and staff inbox", "Basic reports"], highlight: true },
  { key: "pro", name: "Pro", monthlyUsd: 99, aiReplies: 3000, channels: 4, staffSeats: 10, features: ["Everything in Growth", "Messenger and Instagram", "AI business analyst", "Campaign messages (opt-in)", "CSV and PDF exports"] },
  { key: "business", name: "Business", monthlyUsd: 199, aiReplies: 10000, channels: 4, staffSeats: 25, features: ["Everything in Pro", "Multiple locations", "Priority support", "Custom workflows", "API and webhooks"] },
];

export const planByKey = (k: string) => plans.find((p) => p.key === k)!;

export const businesses: Business[] = [
  { id: "b_karachi", slug: "karachi-biryani", name: "Karachi Biryani House", industry: "restaurant", country: "Pakistan", city: "Karachi", currency: "PKR", owner: { name: "Imran Siddiqui", email: "imran@kbh.example", phone: "+92 300 1234567" }, plan: "growth", status: "active", registeredAt: "2026-08-14T10:00:00Z", renewsAt: "2026-11-14T00:00:00Z", channels: ["website", "whatsapp"], usage: { aiReplies: 684, conversations: 312, orders: 148 }, branding: { brand: "oklch(0.6 0.19 35)", logoText: "K" }, mrrUsd: 49 },
  { id: "b_sweet", slug: "sweet-crumbs", name: "Sweet Crumbs Bakery", industry: "bakery", country: "United Kingdom", city: "Manchester", currency: "GBP", owner: { name: "Hannah Price", email: "hannah@sweetcrumbs.example", phone: "+44 7700 900123" }, plan: "starter", status: "active", registeredAt: "2026-09-02T10:00:00Z", renewsAt: "2026-11-02T00:00:00Z", channels: ["website"], usage: { aiReplies: 212, conversations: 97, orders: 41 }, branding: { brand: "oklch(0.62 0.17 350)", logoText: "S" }, mrrUsd: 19 },
  { id: "b_city", slug: "city-school", name: "City Grammar School", industry: "school", country: "Pakistan", city: "Lahore", currency: "PKR", owner: { name: "Farah Malik", email: "admissions@citygrammar.example", phone: "+92 321 5550101" }, plan: "growth", status: "trial", registeredAt: "2026-10-20T10:00:00Z", renewsAt: "2026-11-03T00:00:00Z", channels: ["website", "whatsapp"], usage: { aiReplies: 143, conversations: 88, orders: 36 }, branding: { brand: "oklch(0.5 0.15 250)", logoText: "C" }, mrrUsd: 0 },
  { id: "b_electric", slug: "electric-world", name: "Electric World", industry: "electrical", country: "Pakistan", city: "Karachi", currency: "PKR", owner: { name: "Bilal Khan", email: "bilal@electricworld.example", phone: "+92 333 7778899" }, plan: "pro", status: "suspended", registeredAt: "2026-07-05T10:00:00Z", renewsAt: "2026-10-05T00:00:00Z", channels: ["website", "whatsapp", "messenger"], usage: { aiReplies: 0, conversations: 0, orders: 0 }, branding: { brand: "oklch(0.7 0.17 80)", logoText: "E" }, mrrUsd: 0 },
  { id: "b_lotus", slug: "lotus-dental", name: "Lotus Dental Clinic", industry: "clinic", country: "United Arab Emirates", city: "Dubai", currency: "USD", owner: { name: "Dr. Sara Haddad", email: "sara@lotusdental.example", phone: "+971 50 123 4567" }, plan: "pro", status: "active", registeredAt: "2026-08-28T10:00:00Z", renewsAt: "2026-11-28T00:00:00Z", channels: ["website", "whatsapp", "instagram"], usage: { aiReplies: 1890, conversations: 740, orders: 265 }, branding: { brand: "oklch(0.55 0.12 190)", logoText: "L" }, mrrUsd: 99 },
  { id: "b_urban", slug: "urban-threads", name: "Urban Threads", industry: "ecommerce", country: "United States", city: "Austin, TX", currency: "USD", owner: { name: "Marcus Lee", email: "marcus@urbanthreads.example", phone: "+1 512 555 0142" }, plan: "growth", status: "active", registeredAt: "2026-09-18T10:00:00Z", renewsAt: "2026-11-18T00:00:00Z", channels: ["website", "instagram"], usage: { aiReplies: 910, conversations: 402, orders: 119 }, branding: { brand: "oklch(0.45 0.05 260)", logoText: "U" }, mrrUsd: 49 },
  { id: "b_spice", slug: "spice-route", name: "Spice Route Kitchen", industry: "restaurant", country: "United Kingdom", city: "Birmingham", currency: "GBP", owner: { name: "Arjun Mehta", email: "arjun@spiceroute.example", phone: "+44 7700 900456" }, plan: "pro", status: "active", registeredAt: "2026-06-11T10:00:00Z", renewsAt: "2026-11-11T00:00:00Z", channels: ["website", "whatsapp", "messenger", "instagram"], usage: { aiReplies: 2640, conversations: 1180, orders: 530 }, branding: { brand: "oklch(0.55 0.2 25)", logoText: "S" }, mrrUsd: 99 },
  { id: "b_maple", slug: "maple-realty", name: "Maple Realty", industry: "real_estate", country: "Canada", city: "Toronto", currency: "USD", owner: { name: "Chloe Tremblay", email: "chloe@maplerealty.example", phone: "+1 416 555 0199" }, plan: "starter", status: "cancelled", registeredAt: "2026-07-22T10:00:00Z", renewsAt: "2026-10-22T00:00:00Z", channels: ["website"], usage: { aiReplies: 0, conversations: 0, orders: 0 }, branding: { brand: "oklch(0.55 0.15 150)", logoText: "M" }, mrrUsd: 0 },
];

export const businessById = (id: string) => businesses.find((b) => b.id === id);
export const businessBySlug = (slug: string) => businesses.find((b) => b.slug === slug);

export const industryLabel: Record<string, string> = {
  restaurant: "Restaurant", bakery: "Bakery", school: "School", clinic: "Clinic", ecommerce: "Ecommerce", electrical: "Electrical & hardware", real_estate: "Real estate",
};

export const invoices: Invoice[] = [
  { id: "inv_1", number: "AF-2026-0041", businessId: "b_spice", plan: "pro", period: "11 Oct – 10 Nov 2026", issuedAt: "2026-10-11T00:00:00Z", dueAt: "2026-10-18T00:00:00Z", amountUsd: 99, taxUsd: 0, status: "paid" },
  { id: "inv_2", number: "AF-2026-0042", businessId: "b_karachi", plan: "growth", period: "14 Oct – 13 Nov 2026", issuedAt: "2026-10-14T00:00:00Z", dueAt: "2026-10-21T00:00:00Z", amountUsd: 49, taxUsd: 0, status: "paid" },
  { id: "inv_3", number: "AF-2026-0043", businessId: "b_urban", plan: "growth", period: "18 Oct – 17 Nov 2026", issuedAt: "2026-10-18T00:00:00Z", dueAt: "2026-10-25T00:00:00Z", amountUsd: 49, taxUsd: 0, status: "paid" },
  { id: "inv_4", number: "AF-2026-0044", businessId: "b_electric", plan: "pro", period: "5 Oct – 4 Nov 2026", issuedAt: "2026-10-05T00:00:00Z", dueAt: "2026-10-12T00:00:00Z", amountUsd: 99, taxUsd: 0, status: "overdue" },
  { id: "inv_5", number: "AF-2026-0045", businessId: "b_lotus", plan: "pro", period: "28 Oct – 27 Nov 2026", issuedAt: "2026-10-28T00:00:00Z", dueAt: "2026-11-04T00:00:00Z", amountUsd: 99, taxUsd: 0, status: "due" },
  { id: "inv_6", number: "AF-2026-0046", businessId: "b_sweet", plan: "starter", period: "2 Nov – 1 Dec 2026", issuedAt: "2026-10-30T00:00:00Z", dueAt: "2026-11-06T00:00:00Z", amountUsd: 19, taxUsd: 0, status: "due" },
  { id: "inv_7", number: "AF-2026-0038", businessId: "b_maple", plan: "starter", period: "22 Sep – 21 Oct 2026", issuedAt: "2026-09-22T00:00:00Z", dueAt: "2026-09-29T00:00:00Z", amountUsd: 19, taxUsd: 0, status: "void" },
];

export const payments: Payment[] = [
  { id: "pay_1", businessId: "b_spice", invoiceId: "inv_1", amountUsd: 99, method: "card", status: "paid", at: "2026-10-11T08:12:00Z", reference: "ch_3Q1xA2" },
  { id: "pay_2", businessId: "b_karachi", invoiceId: "inv_2", amountUsd: 49, method: "bank_transfer", status: "paid", at: "2026-10-15T11:40:00Z", reference: "MCB-778123" },
  { id: "pay_3", businessId: "b_urban", invoiceId: "inv_3", amountUsd: 49, method: "card", status: "paid", at: "2026-10-18T02:03:00Z", reference: "ch_3Q2bB7" },
  { id: "pay_4", businessId: "b_electric", invoiceId: "inv_4", amountUsd: 99, method: "card", status: "failed", at: "2026-10-12T09:00:00Z", reference: "ch_3Q0zZ9" },
  { id: "pay_5", businessId: "b_lotus", invoiceId: "inv_5", amountUsd: 99, method: "card", status: "pending", at: "2026-10-28T00:00:00Z", reference: "—" },
];

export const usage30d: UsageDay[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date("2026-10-02T00:00:00Z"); d.setUTCDate(d.getUTCDate() + i);
  const base = 180 + Math.round(60 * Math.sin(i / 4)) + (i % 7 === 5 || i % 7 === 6 ? 70 : 0) + i * 3;
  return { date: d.toISOString().slice(0, 10), aiReplies: base, costUsd: Math.round(base * 0.0042 * 100) / 100 };
});

export const tickets: Ticket[] = [
  { id: "tk_1", businessId: "b_city", subject: "How do we add fee structure per class?", priority: "normal", status: "open", openedAt: "2026-10-30T09:20:00Z" },
  { id: "tk_2", businessId: "b_electric", subject: "Card declined, need bank transfer details", priority: "high", status: "waiting", openedAt: "2026-10-13T14:00:00Z" },
  { id: "tk_3", businessId: "b_spice", subject: "Instagram DMs not arriving since Tuesday", priority: "high", status: "open", openedAt: "2026-10-29T18:45:00Z" },
  { id: "tk_4", businessId: "b_sweet", subject: "Change widget colour to match our brand", priority: "low", status: "resolved", openedAt: "2026-10-21T10:00:00Z" },
];

export const auditLog: AuditEntry[] = [
  { id: "au_1", actor: "Yousuf (super_admin)", action: "suspended business", target: "Electric World (payment overdue 19 days)", at: "2026-10-31T07:10:00Z", ip: "39.45.x.x" },
  { id: "au_2", actor: "system", action: "generated invoice", target: "AF-2026-0046 for Sweet Crumbs Bakery", at: "2026-10-30T00:00:00Z" },
  { id: "au_3", actor: "Yousuf (super_admin)", action: "extended trial", target: "City Grammar School +7 days", at: "2026-10-29T16:30:00Z", ip: "39.45.x.x" },
  { id: "au_4", actor: "Yousuf (super_admin)", action: "opened impersonation session", target: "Spice Route Kitchen (support ticket tk_3)", at: "2026-10-29T19:02:00Z", ip: "39.45.x.x" },
  { id: "au_5", actor: "system", action: "payment failed", target: "Electric World, ch_3Q0zZ9", at: "2026-10-12T09:00:00Z" },
  { id: "au_6", actor: "Yousuf (super_admin)", action: "changed plan limits", target: "Growth: AI replies 800 → 1000", at: "2026-10-08T12:00:00Z", ip: "39.45.x.x" },
];

export const platformUsers: PlatformUser[] = [
  { id: "pu_1", name: "Yousuf", email: "owner@assistflow.example", role: "super_admin" },
  { id: "pu_2", name: "Support (part-time)", email: "support@assistflow.example", role: "support" },
];

export const platformKpis = {
  businesses: businesses.length,
  active: businesses.filter((b) => b.status === "active").length,
  trial: businesses.filter((b) => b.status === "trial").length,
  mrr: businesses.reduce((s, b) => s + b.mrrUsd, 0),
  conversations30d: businesses.reduce((s, b) => s + b.usage.conversations, 0),
  orders30d: businesses.reduce((s, b) => s + b.usage.orders, 0),
  aiReplies30d: usage30d.reduce((s, d) => s + d.aiReplies, 0),
  aiCost30d: Math.round(usage30d.reduce((s, d) => s + d.costUsd, 0) * 100) / 100,
  outstanding: invoices.filter((i) => i.status === "due" || i.status === "overdue").reduce((s, i) => s + i.amountUsd, 0),
};

export const mrrHistory = [
  { month: "May", mrr: 0 }, { month: "Jun", mrr: 99 }, { month: "Jul", mrr: 217 }, { month: "Aug", mrr: 266 },
  { month: "Sep", mrr: 334 }, { month: "Oct", mrr: 315 },
];
