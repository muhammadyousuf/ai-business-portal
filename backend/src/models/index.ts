import mongoose, { Schema, type HydratedDocumentFromSchema } from "mongoose";

// Every document serialises with `id` instead of `_id`.
mongoose.plugin((schema) => {
  schema.set("toJSON", { virtuals: false, versionKey: false, transform: (_doc: unknown, ret: Record<string, unknown>) => { ret.id = String(ret._id); delete ret._id; return ret; } });
});

const opts = (collection: string) => ({ timestamps: true as const, collection, versionKey: false as const });
const Mixed = Schema.Types.Mixed;

export const NOTIFICATION_PREF_KEYS = ["newOrders", "newMessages", "needsHuman", "appointments", "members", "email"] as const;
const prefs = { newOrders: { type: Boolean, default: true }, newMessages: { type: Boolean, default: true }, needsHuman: { type: Boolean, default: true }, appointments: { type: Boolean, default: true }, members: { type: Boolean, default: true }, email: { type: Boolean, default: false } };

// ---------- principals ----------
const adminUserSchema = new Schema({
  supabaseId: { type: String, required: true, unique: true }, email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, default: "" }, avatarUrl: { type: String, default: "" }, phone: { type: String, default: "" },
  notificationPrefs: { type: prefs, default: () => ({}) }, isSuperAdmin: { type: Boolean, default: true }, lastLoginAt: Date,
}, opts("admin_users"));
export const AdminUser = mongoose.model("AdminUser", adminUserSchema);

const userSchema = new Schema({
  supabaseId: { type: String, required: true, unique: true }, email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, default: "" }, phone: { type: String, default: "" }, avatarUrl: { type: String, default: "" },
  notificationPrefs: { type: prefs, default: () => ({}) }, lastLoginAt: Date,
}, opts("users"));
export const User = mongoose.model("User", userSchema);

// ---------- organizations ----------
const address = { line1: { type: String, default: "" }, line2: { type: String, default: "" }, city: { type: String, default: "" }, state: { type: String, default: "" }, country: { type: String, default: "" }, postalCode: { type: String, default: "" } };

const organizationSchema = new Schema({
  uuid: { type: String, required: true, unique: true }, name: { type: String, required: true }, slug: { type: String, required: true, unique: true },
  categoryKey: { type: String, required: true, index: true }, description: { type: String, default: "" }, logoUrl: { type: String, default: "" },
  website: { type: String, default: "" }, phone: { type: String, default: "" }, email: { type: String, default: "" }, address: { type: address, default: () => ({}) },
  timezone: { type: String, default: "Asia/Karachi" }, currency: { type: String, default: "PKR" },
  ownerUserId: { type: String, required: true, index: true }, status: { type: String, enum: ["active", "suspended", "deleted"], default: "active", index: true },
  deletedAt: Date, suspendedReason: { type: String, default: "" },
  widgetKey: { type: String, required: true, unique: true }, allowedOrigins: { type: [String], default: [] },
}, opts("organizations"));
export const Organization = mongoose.model("Organization", organizationSchema);

const membershipSchema = new Schema({
  orgId: { type: String, required: true }, userId: { type: String, required: true }, role: { type: String, enum: ["owner", "member"], required: true },
  status: { type: String, enum: ["active", "removed"], default: "active" }, invitedBy: String, joinedAt: { type: Date, default: Date.now }, removedAt: Date,
}, opts("memberships"));
membershipSchema.index({ orgId: 1, userId: 1 }, { unique: true });
membershipSchema.index({ userId: 1, status: 1 });
export const Membership = mongoose.model("Membership", membershipSchema);

const invitationSchema = new Schema({
  orgId: { type: String, required: true }, email: { type: String, required: true, lowercase: true }, role: { type: String, enum: ["owner", "member"], default: "member" },
  tokenHash: { type: String, required: true, unique: true }, status: { type: String, enum: ["pending", "accepted", "expired", "revoked"], default: "pending" },
  invitedBy: { type: String, required: true }, expiresAt: { type: Date, required: true }, acceptedBy: String, acceptedAt: Date, emailSent: { type: Boolean, default: false }, lastSentAt: Date,
}, opts("invitations"));
invitationSchema.index({ orgId: 1, email: 1, status: 1 });
export const Invitation = mongoose.model("Invitation", invitationSchema);

// ---------- categories (dynamic) ----------
export const MODULES = ["branches", "catalog", "staff", "qa", "inbox", "orders", "appointments", "inquiries"] as const;
export type ModuleKey = (typeof MODULES)[number];
const categorySchema = new Schema({
  key: { type: String, required: true, unique: true }, name: { type: String, required: true }, description: { type: String, default: "" }, icon: { type: String, default: "store" },
  modules: { type: [String], enum: MODULES, default: ["branches", "qa", "inbox"] },
  labels: { catalogGroup: { type: String, default: "Category" }, catalogItem: { type: String, default: "Item" }, staff: { type: String, default: "Staff" }, appointment: { type: String, default: "Appointment" }, inquiry: { type: String, default: "Inquiry" } },
  inquiryTypes: { type: [String], default: ["general"] }, isActive: { type: Boolean, default: true }, sortOrder: { type: Number, default: 100 }, isSystem: { type: Boolean, default: false },
}, opts("categories"));
export const Category = mongoose.model("Category", categorySchema);

// ---------- business data ----------
const hours = new Schema({ day: { type: Number, min: 0, max: 6, required: true }, open: { type: String, default: "09:00" }, close: { type: String, default: "18:00" }, closed: { type: Boolean, default: false } }, { _id: false });
const branchSchema = new Schema({
  orgId: { type: String, required: true }, name: { type: String, required: true }, address: { type: address, default: () => ({}) }, phone: { type: String, default: "" }, email: { type: String, default: "" },
  hours: { type: [hours], default: [] }, lat: Number, lng: Number, isMain: { type: Boolean, default: false }, isActive: { type: Boolean, default: true }, deliveryAreas: { type: [String], default: [] }, deliveryCharge: { type: Number, default: 0 },
}, opts("branches"));
branchSchema.index({ orgId: 1, isActive: 1 });
export const Branch = mongoose.model("Branch", branchSchema);

const catalogGroupSchema = new Schema({ orgId: { type: String, required: true }, branchId: String, name: { type: String, required: true }, description: { type: String, default: "" }, imageUrl: { type: String, default: "" }, sortOrder: { type: Number, default: 100 }, isActive: { type: Boolean, default: true } }, opts("catalog_groups"));
catalogGroupSchema.index({ orgId: 1, sortOrder: 1 });
export const CatalogGroup = mongoose.model("CatalogGroup", catalogGroupSchema);

const option = new Schema({ name: { type: String, required: true }, choices: [{ label: { type: String, required: true }, delta: { type: Number, default: 0 } }] }, { _id: false });
const catalogItemSchema = new Schema({
  orgId: { type: String, required: true }, groupId: { type: String, required: true }, branchId: String, name: { type: String, required: true }, description: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 }, currency: { type: String, default: "PKR" }, imageUrl: { type: String, default: "" }, files: { type: [String], default: [] }, tags: { type: [String], default: [] },
  options: { type: [option], default: [] }, isAvailable: { type: Boolean, default: true }, sortOrder: { type: Number, default: 100 }, durationMinutes: Number,
}, opts("catalog_items"));
catalogItemSchema.index({ orgId: 1, groupId: 1, sortOrder: 1 });
catalogItemSchema.index({ orgId: 1, name: "text", description: "text", tags: "text" });
export const CatalogItem = mongoose.model("CatalogItem", catalogItemSchema);

const availability = new Schema({ day: { type: Number, min: 0, max: 6, required: true }, start: { type: String, required: true }, end: { type: String, required: true } }, { _id: false });
const staffSchema = new Schema({
  orgId: { type: String, required: true }, branchId: String, name: { type: String, required: true }, title: { type: String, default: "" }, specialty: { type: String, default: "" }, bio: { type: String, default: "" },
  photoUrl: { type: String, default: "" }, fee: { type: Number, default: 0 }, email: { type: String, default: "" }, phone: { type: String, default: "" }, availability: { type: [availability], default: [] }, slotMinutes: { type: Number, default: 30 }, isActive: { type: Boolean, default: true },
}, opts("staff_profiles"));
staffSchema.index({ orgId: 1, isActive: 1 });
export const StaffProfile = mongoose.model("StaffProfile", staffSchema);

// ---------- chatbot ----------
const chatbotConfigSchema = new Schema({
  orgId: { type: String, required: true, unique: true }, name: { type: String, default: "Assistant" }, greeting: { type: String, default: "Hi! How can I help you today?" },
  fallbackMessage: { type: String, default: "I'm not sure about that yet. A team member will reply here shortly." }, collectContact: { type: Boolean, default: true },
  brandColor: { type: String, default: "#4f46e5" }, position: { type: String, enum: ["bottom-right", "bottom-left"], default: "bottom-right" }, buttonLabel: { type: String, default: "Chat with us" },
  quickReplies: { type: [String], default: [] }, handoverKeywords: { type: [String], default: ["human", "agent", "person", "complaint"] }, isEnabled: { type: Boolean, default: true }, poweredBy: { type: Boolean, default: true },
}, opts("chatbot_configs"));
export const ChatbotConfig = mongoose.model("ChatbotConfig", chatbotConfigSchema);

const qaSchema = new Schema({ orgId: { type: String, required: true }, branchId: String, question: { type: String, required: true }, answer: { type: String, required: true }, keywords: { type: [String], default: [] }, isActive: { type: Boolean, default: true }, hits: { type: Number, default: 0 } }, opts("chatbot_qas"));
qaSchema.index({ orgId: 1, isActive: 1 });
export const ChatbotQa = mongoose.model("ChatbotQa", qaSchema);

const unansweredSchema = new Schema({ orgId: { type: String, required: true }, question: { type: String, required: true }, normalized: { type: String, required: true }, count: { type: Number, default: 1 }, lastAskedAt: { type: Date, default: Date.now }, resolvedQaId: String }, opts("unanswered_questions"));
unansweredSchema.index({ orgId: 1, normalized: 1 }, { unique: true });
export const UnansweredQuestion = mongoose.model("UnansweredQuestion", unansweredSchema);

// ---------- conversations ----------
const customer = { name: { type: String, default: "" }, phone: { type: String, default: "" }, email: { type: String, default: "" }, address: { type: String, default: "" } };
const conversationSchema = new Schema({
  orgId: { type: String, required: true }, branchId: String, channel: { type: String, default: "website" }, visitorId: { type: String, required: true },
  customer: { type: customer, default: () => ({}) }, status: { type: String, enum: ["bot", "needs_human", "human", "closed"], default: "bot" }, assignedTo: String,
  lastMessageAt: { type: Date, default: Date.now }, lastMessagePreview: { type: String, default: "" }, unreadForStaff: { type: Number, default: 0 }, pageUrl: { type: String, default: "" },
  fallbackStreak: { type: Number, default: 0 }, closedAt: Date, closedBy: String, botState: { type: Mixed, default: () => ({}) },
}, opts("conversations"));
conversationSchema.index({ orgId: 1, lastMessageAt: -1 });
conversationSchema.index({ orgId: 1, status: 1 });
conversationSchema.index({ visitorId: 1 });
export const Conversation = mongoose.model("Conversation", conversationSchema);

const messageSchema = new Schema({
  orgId: { type: String, required: true }, conversationId: { type: String, required: true }, from: { type: String, enum: ["customer", "bot", "staff", "system"], required: true },
  text: { type: String, required: true }, authorUserId: String, authorName: String, meta: { type: Mixed, default: () => ({}) },
}, opts("messages"));
messageSchema.index({ orgId: 1, conversationId: 1, createdAt: 1 });
export const Message = mongoose.model("Message", messageSchema);

const botSessionSchema = new Schema({ orgId: { type: String, required: true }, conversationId: { type: String, required: true }, visitorId: { type: String, required: true }, tokenHash: { type: String, required: true, unique: true }, lastSeenAt: { type: Date, default: Date.now } }, opts("bot_sessions"));
botSessionSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });
export const BotSession = mongoose.model("BotSession", botSessionSchema);

// ---------- intake records ----------
const statusHistory = new Schema({ status: { type: String, required: true }, by: { type: String, default: "system" }, byName: { type: String, default: "" }, note: { type: String, default: "" }, at: { type: Date, default: Date.now } }, { _id: false });
export const ORDER_STATUSES = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"] as const;
const orderSchema = new Schema({
  orgId: { type: String, required: true }, branchId: String, conversationId: String, number: { type: Number, required: true },
  customer: { type: customer, default: () => ({}) }, items: [{ itemId: String, name: { type: String, required: true }, qty: { type: Number, required: true, min: 1 }, unitPrice: { type: Number, required: true }, options: { type: String, default: "" } }],
  subtotal: { type: Number, required: true }, deliveryCharge: { type: Number, default: 0 }, total: { type: Number, required: true }, currency: { type: String, default: "PKR" }, notes: { type: String, default: "" },
  status: { type: String, enum: ORDER_STATUSES, default: "pending" }, statusHistory: { type: [statusHistory], default: [] }, source: { type: String, enum: ["bot", "manual"], default: "bot" },
}, opts("orders"));
orderSchema.index({ orgId: 1, createdAt: -1 });
orderSchema.index({ orgId: 1, status: 1 });
orderSchema.index({ orgId: 1, number: 1 }, { unique: true });
export const Order = mongoose.model("Order", orderSchema);

export const APPOINTMENT_STATUSES = ["requested", "confirmed", "completed", "cancelled", "no_show"] as const;
const appointmentSchema = new Schema({
  orgId: { type: String, required: true }, branchId: String, conversationId: String, number: { type: Number, required: true }, staffId: String, staffName: { type: String, default: "" },
  customer: { type: customer, default: () => ({}) }, service: { type: String, default: "" }, requestedAt: Date, requestedText: { type: String, default: "" }, notes: { type: String, default: "" },
  status: { type: String, enum: APPOINTMENT_STATUSES, default: "requested" }, statusHistory: { type: [statusHistory], default: [] },
}, opts("appointments"));
appointmentSchema.index({ orgId: 1, createdAt: -1 });
appointmentSchema.index({ orgId: 1, status: 1 });
export const Appointment = mongoose.model("Appointment", appointmentSchema);

export const INQUIRY_STATUSES = ["new", "in_progress", "resolved", "closed"] as const;
const inquirySchema = new Schema({
  orgId: { type: String, required: true }, branchId: String, conversationId: String, number: { type: Number, required: true }, type: { type: String, default: "general" },
  customer: { type: customer, default: () => ({}) }, subject: { type: String, default: "" }, details: { type: String, default: "" },
  status: { type: String, enum: INQUIRY_STATUSES, default: "new" }, statusHistory: { type: [statusHistory], default: [] },
}, opts("inquiries"));
inquirySchema.index({ orgId: 1, createdAt: -1 });
inquirySchema.index({ orgId: 1, status: 1 });
export const Inquiry = mongoose.model("Inquiry", inquirySchema);

// ---------- platform ----------
const notificationSchema = new Schema({
  recipientType: { type: String, enum: ["admin", "user"], required: true }, recipientId: { type: String, required: true }, orgId: String,
  type: { type: String, required: true }, title: { type: String, required: true }, body: { type: String, default: "" }, link: { type: String, default: "" }, readAt: Date,
}, opts("notifications"));
notificationSchema.index({ recipientType: 1, recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, readAt: 1 });
export const Notification = mongoose.model("Notification", notificationSchema);

const activitySchema = new Schema({
  orgId: String, actorType: { type: String, enum: ["admin", "user", "bot", "system"], required: true }, actorId: { type: String, default: "" }, actorName: { type: String, default: "" },
  action: { type: String, required: true }, targetType: { type: String, default: "" }, targetId: { type: String, default: "" }, summary: { type: String, required: true }, meta: { type: Mixed, default: () => ({}) },
}, opts("activity_logs"));
activitySchema.index({ orgId: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });
export const ActivityLog = mongoose.model("ActivityLog", activitySchema);

const fileSchema = new Schema({
  orgId: String, uploaderType: { type: String, enum: ["admin", "user"], required: true }, uploaderId: { type: String, required: true }, provider: { type: String, enum: ["local", "cloudinary"], required: true },
  providerId: { type: String, default: "" }, path: { type: String, default: "" }, url: { type: String, required: true }, mime: { type: String, required: true }, size: { type: Number, required: true },
  purpose: { type: String, required: true }, originalName: { type: String, default: "" },
}, opts("files"));
fileSchema.index({ orgId: 1, createdAt: -1 });
export const FileRecord = mongoose.model("FileRecord", fileSchema);

const counterSchema = new Schema({ key: { type: String, required: true, unique: true }, seq: { type: Number, default: 0 } }, { collection: "counters", versionKey: false });
export const Counter = mongoose.model("Counter", counterSchema);

export type OrganizationDoc = HydratedDocumentFromSchema<typeof organizationSchema>;
export type UserDoc = HydratedDocumentFromSchema<typeof userSchema>;
export type AdminUserDoc = HydratedDocumentFromSchema<typeof adminUserSchema>;
export type MembershipDoc = HydratedDocumentFromSchema<typeof membershipSchema>;
export type CategoryDoc = HydratedDocumentFromSchema<typeof categorySchema>;
export type ConversationDoc = HydratedDocumentFromSchema<typeof conversationSchema>;
export type ChatbotConfigDoc = HydratedDocumentFromSchema<typeof chatbotConfigSchema>;
