import type {
  ActivityItem, Category, ChannelConnection, Conversation, Customer, DeliveryZone, Faq, Hours, KnowledgeDoc,
  NotificationLog, Order, Product, Staff,
} from "./types";

// Demo business: Karachi Biryani House (b_karachi). Prices in PKR.

export const categories: Category[] = [
  { id: "c_biryani", name: "Biryani" },
  { id: "c_bbq", name: "BBQ" },
  { id: "c_karahi", name: "Karahi" },
  { id: "c_sides", name: "Sides & Breads" },
  { id: "c_drinks", name: "Drinks & Desserts" },
];

export const products: Product[] = [
  { id: "p_cb", categoryId: "c_biryani", name: "Chicken Biryani", description: "Sindhi style, with raita and salad", price: 350, options: [{ name: "Portion", choices: [{ label: "Single", delta: 0 }, { label: "Family (4)", delta: 950 }] }], available: true, popular: true },
  { id: "p_bb", categoryId: "c_biryani", name: "Beef Biryani", price: 420, available: true, popular: true },
  { id: "p_mb", categoryId: "c_biryani", name: "Mutton Biryani", price: 650, available: true },
  { id: "p_pb", categoryId: "c_biryani", name: "Prawn Biryani", price: 780, available: false },
  { id: "p_tikka", categoryId: "c_bbq", name: "Chicken Tikka (half)", price: 480, available: true, popular: true },
  { id: "p_seekh", categoryId: "c_bbq", name: "Beef Seekh Kabab (4 pcs)", price: 520, available: true },
  { id: "p_malai", categoryId: "c_bbq", name: "Malai Boti (half)", price: 560, available: true },
  { id: "p_ck", categoryId: "c_karahi", name: "Chicken Karahi", price: 1450, options: [{ name: "Size", choices: [{ label: "Half kg", delta: 0 }, { label: "Full kg", delta: 1300 }] }], available: true },
  { id: "p_mk", categoryId: "c_karahi", name: "Mutton Karahi", price: 2600, available: true },
  { id: "p_naan", categoryId: "c_sides", name: "Naan", price: 40, available: true },
  { id: "p_raita", categoryId: "c_sides", name: "Raita", price: 60, available: true },
  { id: "p_salad", categoryId: "c_sides", name: "Fresh Salad", price: 80, available: true },
  { id: "p_cola", categoryId: "c_drinks", name: "Soft Drink (1.5L)", price: 180, available: true },
  { id: "p_kheer", categoryId: "c_drinks", name: "Kheer", price: 150, available: true },
];

export const productById = (id: string) => products.find((p) => p.id === id);

export const deliveryZones: DeliveryZone[] = [
  { id: "z_gm", name: "Gulshan-e-Maymar", charge: 100, etaMins: 40, active: true },
  { id: "z_gi", name: "Gulshan-e-Iqbal", charge: 150, etaMins: 50, active: true },
  { id: "z_jt", name: "Johar Town / Gulistan-e-Johar", charge: 150, etaMins: 55, active: true },
  { id: "z_ns", name: "North Nazimabad", charge: 200, etaMins: 60, active: true },
  { id: "z_dha", name: "DHA / Clifton", charge: 0, etaMins: 0, active: false },
];

export const hours: Hours[] = [
  { day: "Mon", open: "12:00", close: "23:30" }, { day: "Tue", open: "12:00", close: "23:30" }, { day: "Wed", open: "12:00", close: "23:30" },
  { day: "Thu", open: "12:00", close: "23:30" }, { day: "Fri", open: "13:30", close: "00:30" }, { day: "Sat", open: "12:00", close: "00:30" }, { day: "Sun", open: "12:00", close: "23:30" },
];

export const faqs: Faq[] = [
  { id: "f_1", question: "Do you deliver to my area?", answer: "We deliver to Gulshan-e-Maymar, Gulshan-e-Iqbal, Gulistan-e-Johar and North Nazimabad. Charges are Rs. 100–200 depending on area.", source: "owner", hits30d: 96 },
  { id: "f_2", question: "What are your timings?", answer: "Open daily 12:00 to 23:30. Friday we open at 13:30 after Jumma. Weekends until 00:30.", source: "owner", hits30d: 61 },
  { id: "f_3", question: "Do you have family deals?", answer: "Yes. Family Chicken Biryani serves 4 for Rs. 1,300. Karahi full kg comes with 4 naan.", source: "owner", hits30d: 44 },
  { id: "f_4", question: "Is payment cash on delivery only?", answer: "Cash on delivery and bank transfer (details shared on confirmation call). No card on delivery yet.", source: "owner", hits30d: 38 },
  { id: "f_5", question: "Minimum order for delivery?", answer: "Rs. 500 excluding delivery charge.", source: "ai_suggested", hits30d: 27 },
  { id: "f_6", question: "Do you cater for events?", answer: "Yes, for 30+ people with 24 hours notice. The team will call you to confirm the menu.", source: "ai_suggested", hits30d: 12 },
];

export const knowledgeDocs: KnowledgeDoc[] = [
  { id: "kd_1", name: "Menu_Oct_2026.pdf", size: "1.1 MB", chunks: 38, uploadedAt: "2026-10-01T09:00:00Z", status: "indexed" },
  { id: "kd_2", name: "Catering_Packages.docx", size: "84 KB", chunks: 12, uploadedAt: "2026-09-15T09:00:00Z", status: "indexed" },
  { id: "kd_3", name: "Ramadan_Deals_2026.pdf", size: "620 KB", chunks: 9, uploadedAt: "2026-10-30T18:20:00Z", status: "processing" },
];

export const customers: Customer[] = [
  { id: "cu_ali", name: "Ali Raza", phone: "+92 300 2345678", area: "Gulshan-e-Maymar", tags: ["repeat", "weekend"], orders: 5, spent: 4350, lastSeen: "2026-10-31T13:02:00Z", firstSeen: "2026-09-06T19:00:00Z", channel: "website" },
  { id: "cu_sana", name: "Sana Ahmed", phone: "+92 321 9876543", email: "sana.a@example.com", area: "Gulshan-e-Iqbal", tags: ["new"], orders: 1, spent: 1050, lastSeen: "2026-10-31T12:40:00Z", firstSeen: "2026-10-31T12:30:00Z", channel: "whatsapp" },
  { id: "cu_hamza", name: "Hamza Qureshi", phone: "+92 333 1112223", area: "North Nazimabad", tags: ["vip", "catering"], orders: 12, spent: 38400, lastSeen: "2026-10-30T20:15:00Z", firstSeen: "2026-08-20T19:00:00Z", channel: "whatsapp", notes: "Office orders every Friday. Prefers less spicy." },
  { id: "cu_maria", name: "Maria Khan", phone: "+92 345 5556667", area: "Gulistan-e-Johar", tags: ["repeat"], orders: 3, spent: 2210, lastSeen: "2026-10-30T19:50:00Z", firstSeen: "2026-10-02T19:00:00Z", channel: "website" },
  { id: "cu_usman", name: "Usman Tariq", phone: "+92 302 4443332", area: "DHA", tags: ["out_of_zone"], orders: 0, spent: 0, lastSeen: "2026-10-30T14:10:00Z", firstSeen: "2026-10-30T14:05:00Z", channel: "website" },
  { id: "cu_zara", name: "Zara Iqbal", phone: "+92 311 7778880", area: "Gulshan-e-Maymar", tags: ["repeat"], orders: 4, spent: 3120, lastSeen: "2026-10-29T21:00:00Z", firstSeen: "2026-09-12T19:00:00Z", channel: "website" },
  { id: "cu_bilal", name: "Bilal Shaikh", phone: "+92 300 6667778", area: "Gulshan-e-Iqbal", tags: ["complaint"], orders: 2, spent: 1600, lastSeen: "2026-10-28T22:30:00Z", firstSeen: "2026-10-10T19:00:00Z", channel: "whatsapp", notes: "Late delivery on 28 Oct, offered Rs. 100 off next order." },
];

export const customerById = (id: string) => customers.find((c) => c.id === id);

export const orders: Order[] = [
  { id: "o_1048", number: "#1048", customerId: "cu_ali", conversationId: "cv_1", channel: "website", items: [{ productId: "p_cb", name: "Chicken Biryani", qty: 2, unitPrice: 350 }, { productId: "p_raita", name: "Raita", qty: 1, unitPrice: 60 }], subtotal: 760, deliveryCharge: 100, total: 860, address: "House 12, Street 4, Gulshan-e-Maymar", zoneId: "z_gm", status: "pending", placedAt: "2026-10-31T13:02:00Z", notified: { email: true, whatsapp: true }, source: "ai" },
  { id: "o_1047", number: "#1047", customerId: "cu_sana", conversationId: "cv_2", channel: "whatsapp", items: [{ productId: "p_ck", name: "Chicken Karahi", qty: 1, unitPrice: 1450, options: "Half kg" }, { productId: "p_naan", name: "Naan", qty: 4, unitPrice: 40 }], subtotal: 1610, deliveryCharge: 150, total: 1760, address: "Flat 302, Block 13-D, Gulshan-e-Iqbal", zoneId: "z_gi", status: "pending", placedAt: "2026-10-31T12:40:00Z", notified: { email: true, whatsapp: true }, source: "ai" },
  { id: "o_1046", number: "#1046", customerId: "cu_hamza", conversationId: "cv_3", channel: "whatsapp", items: [{ productId: "p_cb", name: "Chicken Biryani", qty: 1, unitPrice: 1300, options: "Family (4)" }, { productId: "p_tikka", name: "Chicken Tikka (half)", qty: 2, unitPrice: 480 }, { productId: "p_cola", name: "Soft Drink (1.5L)", qty: 2, unitPrice: 180 }], subtotal: 2620, deliveryCharge: 200, total: 2820, address: "Office 5, Block H, North Nazimabad", zoneId: "z_ns", status: "confirmed", placedAt: "2026-10-30T20:15:00Z", notes: "Less spicy. Deliver 1:30pm Friday.", notified: { email: true, whatsapp: true }, source: "ai" },
  { id: "o_1045", number: "#1045", customerId: "cu_maria", channel: "website", items: [{ productId: "p_bb", name: "Beef Biryani", qty: 2, unitPrice: 420 }], subtotal: 840, deliveryCharge: 150, total: 990, address: "Block 15, Gulistan-e-Johar", zoneId: "z_jt", status: "completed", placedAt: "2026-10-30T19:50:00Z", notified: { email: true, whatsapp: false }, source: "ai" },
  { id: "o_1044", number: "#1044", customerId: "cu_zara", channel: "website", items: [{ productId: "p_mb", name: "Mutton Biryani", qty: 1, unitPrice: 650 }, { productId: "p_kheer", name: "Kheer", qty: 2, unitPrice: 150 }], subtotal: 950, deliveryCharge: 100, total: 1050, address: "Sector X, Gulshan-e-Maymar", zoneId: "z_gm", status: "completed", placedAt: "2026-10-29T21:00:00Z", notified: { email: true, whatsapp: true }, source: "ai" },
  { id: "o_1043", number: "#1043", customerId: "cu_bilal", channel: "whatsapp", items: [{ productId: "p_seekh", name: "Beef Seekh Kabab (4 pcs)", qty: 1, unitPrice: 520 }, { productId: "p_naan", name: "Naan", qty: 3, unitPrice: 40 }], subtotal: 640, deliveryCharge: 150, total: 790, address: "Block 6, Gulshan-e-Iqbal", zoneId: "z_gi", status: "completed", placedAt: "2026-10-28T21:10:00Z", notes: "Delivered 35 min late. Complaint logged.", notified: { email: true, whatsapp: true }, source: "ai" },
  { id: "o_1042", number: "#1042", customerId: "cu_hamza", channel: "whatsapp", items: [{ productId: "p_mk", name: "Mutton Karahi", qty: 2, unitPrice: 2600 }, { productId: "p_naan", name: "Naan", qty: 12, unitPrice: 40 }], subtotal: 5680, deliveryCharge: 200, total: 5880, address: "Office 5, Block H, North Nazimabad", zoneId: "z_ns", status: "completed", placedAt: "2026-10-24T13:00:00Z", notified: { email: true, whatsapp: true }, source: "manual" },
  { id: "o_1041", number: "#1041", customerId: "cu_ali", channel: "website", items: [{ productId: "p_cb", name: "Chicken Biryani", qty: 3, unitPrice: 350 }], subtotal: 1050, deliveryCharge: 100, total: 1150, address: "House 12, Street 4, Gulshan-e-Maymar", zoneId: "z_gm", status: "cancelled", placedAt: "2026-10-22T20:00:00Z", notes: "Customer unreachable on confirmation call.", notified: { email: true, whatsapp: true }, source: "ai" },
];

export const orderById = (id: string) => orders.find((o) => o.id === id);

export const conversations: Conversation[] = [
  {
    id: "cv_1", customerId: "cu_ali", channel: "website", status: "resolved", lastMessageAt: "2026-10-31T13:02:00Z", preview: "Your order request #1048 has been received…", unread: 0, orderId: "o_1048", aiConfidence: 0.96, language: "en",
    messages: [
      { id: "m1", from: "customer", text: "Hi, do you deliver to Gulshan-e-Maymar?", at: "2026-10-31T12:58:00Z" },
      { id: "m2", from: "ai", text: "Yes, we deliver to Gulshan-e-Maymar. Delivery charge is Rs. 100 and it usually takes about 40 minutes.", at: "2026-10-31T12:58:05Z", tool: "checkDeliveryAvailability" },
      { id: "m3", from: "customer", text: "How much is chicken biryani?", at: "2026-10-31T12:59:00Z" },
      { id: "m4", from: "ai", text: "Chicken Biryani is Rs. 350 for a single portion, or Rs. 1,300 for the family size that serves 4. It comes with raita and salad.", at: "2026-10-31T12:59:04Z", tool: "getProductPrice" },
      { id: "m5", from: "customer", text: "2 singles and one extra raita please", at: "2026-10-31T13:00:00Z" },
      { id: "m6", from: "ai", text: "Got it: 2 × Chicken Biryani (Rs. 700) and 1 × Raita (Rs. 60). With Rs. 100 delivery that is Rs. 860. Please share your name, phone number and full address.", at: "2026-10-31T13:00:06Z" },
      { id: "m7", from: "customer", text: "Ali Raza, 0300 2345678, House 12, Street 4, Gulshan-e-Maymar", at: "2026-10-31T13:01:30Z" },
      { id: "m8", from: "ai", text: "Thank you Ali. Your order request #1048 has been received. The restaurant will call you on 0300 2345678 shortly to confirm. Payment is cash on delivery.", at: "2026-10-31T13:02:00Z", tool: "createOrderRequest" },
      { id: "m9", from: "system", text: "Order #1048 created · Email sent to orders@kbh.example · WhatsApp sent to +92 300 1234567", at: "2026-10-31T13:02:01Z" },
    ],
  },
  {
    id: "cv_2", customerId: "cu_sana", channel: "whatsapp", status: "resolved", lastMessageAt: "2026-10-31T12:40:00Z", preview: "Aapka order #1047 receive ho gaya hai…", unread: 0, orderId: "o_1047", aiConfidence: 0.93, language: "ur",
    messages: [
      { id: "m1", from: "customer", text: "Salam, karahi half kg kitne ki hai?", at: "2026-10-31T12:31:00Z" },
      { id: "m2", from: "ai", text: "Walaikum salam! Chicken Karahi half kg Rs. 1,450 ki hai aur full kg Rs. 2,750 (4 naan ke saath). Mutton Karahi Rs. 2,600 se shuru hoti hai.", at: "2026-10-31T12:31:06Z", tool: "getProductPrice" },
      { id: "m3", from: "customer", text: "Half kg chicken aur 4 naan. Gulshan-e-Iqbal block 13-D delivery hogi?", at: "2026-10-31T12:34:00Z" },
      { id: "m4", from: "ai", text: "Ji haan, Gulshan-e-Iqbal mein delivery hoti hai, charges Rs. 150 aur waqt taqreeban 50 minute. Total: Rs. 1,450 + Rs. 160 + Rs. 150 = Rs. 1,760. Apna naam aur poora address bhej dein.", at: "2026-10-31T12:34:07Z", tool: "checkDeliveryAvailability" },
      { id: "m5", from: "customer", text: "Sana Ahmed, Flat 302, Block 13-D", at: "2026-10-31T12:39:00Z" },
      { id: "m6", from: "ai", text: "Shukriya Sana. Aapka order #1047 receive ho gaya hai. Restaurant aapko call karke confirm karega. Payment cash on delivery hai.", at: "2026-10-31T12:40:00Z", tool: "createOrderRequest" },
    ],
  },
  {
    id: "cv_4", customerId: "cu_usman", channel: "website", status: "needs_attention", lastMessageAt: "2026-10-30T14:10:00Z", preview: "Can you make an exception for DHA? Big order…", unread: 2, aiConfidence: 0.41, language: "en",
    messages: [
      { id: "m1", from: "customer", text: "Do you deliver to DHA Phase 6?", at: "2026-10-30T14:05:00Z" },
      { id: "m2", from: "ai", text: "Sorry, we do not currently deliver to DHA. Our delivery areas are Gulshan-e-Maymar, Gulshan-e-Iqbal, Gulistan-e-Johar and North Nazimabad. You are welcome to place a pickup order.", at: "2026-10-30T14:05:04Z", tool: "checkDeliveryAvailability" },
      { id: "m3", from: "customer", text: "Can you make an exception for DHA? Big order, around 20 people for Saturday.", at: "2026-10-30T14:10:00Z" },
      { id: "m4", from: "system", text: "AI confidence 41% (policy exception requested). Handed over to staff. Owner notified by WhatsApp.", at: "2026-10-30T14:10:02Z" },
    ],
  },
  {
    id: "cv_3", customerId: "cu_hamza", channel: "whatsapp", status: "human", assignedTo: "st_ayesha", lastMessageAt: "2026-10-30T20:30:00Z", preview: "Ayesha: Confirmed for 1:30pm Friday, less spicy noted.", unread: 0, orderId: "o_1046", aiConfidence: 0.9, language: "en",
    messages: [
      { id: "m1", from: "customer", text: "Friday office order again. Family biryani, 2 half tikka, 2 drinks. 1:30pm.", at: "2026-10-30T20:12:00Z" },
      { id: "m2", from: "ai", text: "Welcome back Hamza. Family Chicken Biryani (Rs. 1,300), 2 × Chicken Tikka half (Rs. 960), 2 × Soft Drink 1.5L (Rs. 360). Delivery to North Nazimabad Rs. 200. Total Rs. 2,820 for Friday 1:30pm at Office 5, Block H. Shall I place the request?", at: "2026-10-30T20:12:06Z", tool: "createOrderRequest" },
      { id: "m3", from: "customer", text: "Yes. And less spicy like last time.", at: "2026-10-30T20:15:00Z" },
      { id: "m4", from: "ai", text: "Order request #1046 placed with the note 'less spicy'. The team will confirm shortly.", at: "2026-10-30T20:15:03Z" },
      { id: "m5", from: "staff", staffName: "Ayesha", text: "Confirmed for 1:30pm Friday, less spicy noted. Thanks Hamza bhai!", at: "2026-10-30T20:30:00Z" },
    ],
  },
  {
    id: "cv_5", customerId: "cu_maria", channel: "website", status: "resolved", lastMessageAt: "2026-10-30T19:50:00Z", preview: "Order request #1045 received…", unread: 0, orderId: "o_1045", aiConfidence: 0.95, language: "en",
    messages: [
      { id: "m1", from: "customer", text: "2 beef biryani to Johar block 15", at: "2026-10-30T19:47:00Z" },
      { id: "m2", from: "ai", text: "2 × Beef Biryani is Rs. 840, delivery to Gulistan-e-Johar Rs. 150, total Rs. 990. Please confirm your name and phone number.", at: "2026-10-30T19:47:05Z", tool: "getProductPrice" },
      { id: "m3", from: "customer", text: "Maria Khan 0345 5556667", at: "2026-10-30T19:49:30Z" },
      { id: "m4", from: "ai", text: "Thanks Maria, order request #1045 received. You will get a confirmation call shortly.", at: "2026-10-30T19:50:00Z", tool: "createOrderRequest" },
    ],
  },
  {
    id: "cv_6", customerId: "cu_bilal", channel: "whatsapp", status: "resolved", assignedTo: "st_imran", lastMessageAt: "2026-10-28T22:45:00Z", preview: "Imran: Sorry for the delay, Rs. 100 off your next order.", unread: 0, orderId: "o_1043", aiConfidence: 0.52, language: "ur",
    messages: [
      { id: "m1", from: "customer", text: "Order 1 ghanta pehle kiya tha abhi tak nahi aaya", at: "2026-10-28T22:30:00Z" },
      { id: "m2", from: "ai", text: "Maazrat Bilal. Main aapki complaint team ko forward kar raha hoon, woh abhi aapse raabta karenge.", at: "2026-10-28T22:30:04Z", tool: "handoverToHuman" },
      { id: "m3", from: "system", text: "Complaint detected. Handed over to owner.", at: "2026-10-28T22:30:05Z" },
      { id: "m4", from: "staff", staffName: "Imran", text: "Sorry for the delay Bilal bhai, rider is 5 minutes away. Rs. 100 off your next order.", at: "2026-10-28T22:45:00Z" },
    ],
  },
  {
    id: "cv_7", customerId: "cu_zara", channel: "website", status: "ai", lastMessageAt: "2026-10-31T13:20:00Z", preview: "Is prawn biryani available today?", unread: 1, aiConfidence: 0.97, language: "en",
    messages: [
      { id: "m1", from: "customer", text: "Is prawn biryani available today?", at: "2026-10-31T13:19:30Z" },
      { id: "m2", from: "ai", text: "Prawn Biryani is not available today. Chicken, Beef and Mutton Biryani are all available. Would you like one of those?", at: "2026-10-31T13:20:00Z", tool: "searchProducts" },
    ],
  },
];

export const conversationById = (id: string) => conversations.find((c) => c.id === id);

export const staff: Staff[] = [
  { id: "st_imran", name: "Imran Siddiqui", email: "imran@kbh.example", role: "owner", online: true, handled30d: 18 },
  { id: "st_ayesha", name: "Ayesha Noor", email: "ayesha@kbh.example", role: "manager", online: true, handled30d: 41 },
  { id: "st_faisal", name: "Faisal Mehmood", email: "faisal@kbh.example", role: "agent", online: false, handled30d: 9 },
];

export const staffById = (id?: string) => staff.find((s) => s.id === id);

export const channelConnections: ChannelConnection[] = [
  { channel: "website", connected: true, handle: "kbh.example", status: "Widget installed, last ping 2 min ago", messages30d: 1140 },
  { channel: "whatsapp", connected: true, handle: "+92 300 1234567", status: "Cloud API, webhook verified", messages30d: 860 },
  { channel: "messenger", connected: false, status: "Available on Pro plan", messages30d: 0 },
  { channel: "instagram", connected: false, status: "Available on Pro plan", messages30d: 0 },
];

export const notificationLog: NotificationLog[] = [
  { id: "nl_1", kind: "whatsapp", to: "+92 300 1234567", subject: "New order request #1048 · Rs. 860 · Ali Raza", status: "delivered", at: "2026-10-31T13:02:01Z", attempts: 1 },
  { id: "nl_2", kind: "email", to: "orders@kbh.example", subject: "New order request #1048", status: "delivered", at: "2026-10-31T13:02:01Z", attempts: 1 },
  { id: "nl_3", kind: "whatsapp", to: "+92 300 1234567", subject: "New order request #1047 · Rs. 1,760 · Sana Ahmed", status: "delivered", at: "2026-10-31T12:40:01Z", attempts: 1 },
  { id: "nl_4", kind: "whatsapp", to: "+92 300 1234567", subject: "Needs attention: Usman Tariq asked for DHA exception", status: "delivered", at: "2026-10-30T14:10:02Z", attempts: 1 },
  { id: "nl_5", kind: "email", to: "orders@kbh.example", subject: "New order request #1045", status: "failed", at: "2026-10-30T19:50:01Z", attempts: 3 },
  { id: "nl_6", kind: "whatsapp", to: "+92 345 5556667", subject: "Order #1045 confirmed, arriving in ~50 min", status: "delivered", at: "2026-10-30T19:58:00Z", attempts: 1 },
];

export const businessKpis = {
  ordersToday: 2, pendingOrders: orders.filter((o) => o.status === "pending").length,
  orders30d: 148, revenue30d: 171_400, conversations30d: 312, aiResolvedPct: 87, handovers30d: 23, avgResponseSecs: 4,
  unanswered30d: 11, aiRepliesUsed: 684, aiRepliesLimit: 1000,
};

export const topQuestions = [
  { q: "Do you deliver to my area?", n: 96 }, { q: "Price of chicken biryani", n: 78 }, { q: "Timings / are you open now?", n: 61 },
  { q: "Family deal / karahi size", n: 44 }, { q: "Payment methods", n: 38 }, { q: "Order status / where is my order", n: 29 },
];

export const dailyOrders = [
  { day: "Sat 25", orders: 7, revenue: 8900 }, { day: "Sun 26", orders: 9, revenue: 10400 }, { day: "Mon 27", orders: 4, revenue: 4100 },
  { day: "Tue 28", orders: 5, revenue: 5300 }, { day: "Wed 29", orders: 6, revenue: 6250 }, { day: "Thu 30", orders: 8, revenue: 9800 }, { day: "Fri 31", orders: 2, revenue: 2620 },
];

export const businessActivity: ActivityItem[] = [
  { id: "ba_1", actor: "AI assistant", action: "created order request", target: "#1048 for Ali Raza (Rs. 860)", href: "orders/o_1048", at: "2026-10-31T13:02:00Z", kind: "order" },
  { id: "ba_2", actor: "AI assistant", action: "answered", target: "Zara Iqbal about prawn biryani availability", href: "inbox/cv_7", at: "2026-10-31T13:20:00Z", kind: "ai" },
  { id: "ba_3", actor: "AI assistant", action: "created order request", target: "#1047 for Sana Ahmed (Rs. 1,760) via WhatsApp", href: "orders/o_1047", at: "2026-10-31T12:40:00Z", kind: "order" },
  { id: "ba_4", actor: "Imran Siddiqui", action: "uploaded", target: "Ramadan_Deals_2026.pdf to knowledge base", href: "knowledge", at: "2026-10-30T18:20:00Z", kind: "knowledge" },
  { id: "ba_5", actor: "Ayesha Noor", action: "confirmed order", target: "#1046 for Hamza Qureshi", href: "orders/o_1046", at: "2026-10-30T20:30:00Z", kind: "order" },
  { id: "ba_6", actor: "AI assistant", action: "handed over", target: "Usman Tariq (DHA delivery exception)", href: "inbox/cv_4", at: "2026-10-30T14:10:00Z", kind: "conversation" },
  { id: "ba_7", actor: "System", action: "email failed 3 times for", target: "order #1045 notification", href: "settings", at: "2026-10-30T19:50:00Z", kind: "system" },
];

export const fmtPKR = (n: number) => `Rs. ${n.toLocaleString("en-PK")}`;
