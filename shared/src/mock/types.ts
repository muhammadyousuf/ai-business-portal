// Shapes mirror the planned Mongo collections (README §4). Synthetic demo data only.

export type Industry = "restaurant" | "bakery" | "school" | "clinic" | "ecommerce" | "electrical" | "real_estate";
export type Channel = "website" | "whatsapp" | "messenger" | "instagram";
export type PlanKey = "starter" | "growth" | "pro" | "business";
export type Currency = "USD" | "PKR" | "GBP";

export interface Plan {
  key: PlanKey;
  name: string;
  monthlyUsd: number;
  aiReplies: number;
  channels: number;
  staffSeats: number;
  features: string[];
  highlight?: boolean;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  industry: Industry;
  country: string;
  city: string;
  currency: Currency;
  owner: { name: string; email: string; phone: string };
  plan: PlanKey;
  status: "active" | "trial" | "suspended" | "cancelled";
  registeredAt: string;
  renewsAt: string;
  channels: Channel[];
  usage: { aiReplies: number; conversations: number; orders: number };
  branding: { brand: string; logoText: string };
  mrrUsd: number;
}

export interface Payment {
  id: string;
  businessId: string;
  invoiceId: string;
  amountUsd: number;
  method: "card" | "bank_transfer" | "manual";
  status: "paid" | "pending" | "failed" | "refunded";
  at: string;
  reference: string;
}

export interface Invoice {
  id: string;
  number: string;
  businessId: string;
  plan: PlanKey;
  period: string;
  issuedAt: string;
  dueAt: string;
  amountUsd: number;
  taxUsd: number;
  status: "paid" | "due" | "overdue" | "void";
}

export interface UsageDay {
  date: string;
  aiReplies: number;
  costUsd: number;
}

export interface Ticket {
  id: string;
  businessId: string;
  subject: string;
  priority: "low" | "normal" | "high";
  status: "open" | "waiting" | "resolved";
  openedAt: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  ip?: string;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "support" | "finance";
}

// ----- Business-level data (demo business) -----

export interface Category { id: string; name: string; }

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  options?: { name: string; choices: { label: string; delta: number }[] }[];
  available: boolean;
  stock?: number;
  popular?: boolean;
}

export interface DeliveryZone { id: string; name: string; charge: number; etaMins: number; active: boolean; }

export interface Hours { day: string; open: string; close: string; closed?: boolean; }

export interface Faq { id: string; question: string; answer: string; source: "owner" | "ai_suggested"; hits30d: number; }

export interface KnowledgeDoc { id: string; name: string; size: string; chunks: number; uploadedAt: string; status: "indexed" | "processing"; }

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  area?: string;
  tags: string[];
  orders: number;
  spent: number;
  lastSeen: string;
  firstSeen: string;
  channel: Channel;
  notes?: string;
}

export interface Message {
  id: string;
  from: "customer" | "ai" | "staff" | "system";
  text: string;
  at: string;
  tool?: string; // e.g. getProductPrice, checkDeliveryAvailability, createOrderRequest
  staffName?: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  channel: Channel;
  status: "ai" | "human" | "resolved" | "needs_attention";
  assignedTo?: string;
  lastMessageAt: string;
  preview: string;
  unread: number;
  orderId?: string;
  messages: Message[];
  aiConfidence?: number;
  language?: string;
}

export interface OrderItem { productId: string; name: string; qty: number; unitPrice: number; options?: string; }

export interface Order {
  id: string;
  number: string;
  customerId: string;
  conversationId?: string;
  channel: Channel;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  address: string;
  zoneId?: string;
  status: "pending" | "confirmed" | "preparing" | "out_for_delivery" | "completed" | "cancelled";
  placedAt: string;
  notes?: string;
  notified: { email: boolean; whatsapp: boolean };
  source: "ai" | "manual";
}

export interface Staff { id: string; name: string; email: string; role: "owner" | "manager" | "agent"; online: boolean; handled30d: number; }

export interface ChannelConnection {
  channel: Channel;
  connected: boolean;
  handle?: string;
  status?: string;
  messages30d: number;
}

export interface NotificationLog {
  id: string;
  kind: "email" | "whatsapp";
  to: string;
  subject: string;
  status: "delivered" | "failed" | "queued";
  at: string;
  attempts: number;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  href?: string;
  at: string;
  kind: "order" | "conversation" | "ai" | "billing" | "system" | "knowledge";
}
