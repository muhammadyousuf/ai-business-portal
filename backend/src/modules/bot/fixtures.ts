// Temporary in-memory business data for the bot while there is no database.
// Mirrors shared/src/mock/business.ts for the demo restaurant.
export interface BotBusiness {
  id: string;
  key: string; // public widget key, e.g. pk_live_xxx; the slug works in dev
  name: string;
  logoText: string;
  brand: string;
  locale: string;
  allowedOrigins: string[];
  greeting: string;
  quickReplies: string[];
  ownerPhone: string;
  ownerEmail: string;
  products: { id: string; name: string; aliases: string[]; price: number; available: boolean; note?: string }[];
  zones: { name: string; aliases: string[]; charge: number; etaMins: number }[];
  hours: string;
  minOrder: number;
}

export const businesses: BotBusiness[] = [
  {
    id: "b_karachi", key: "karachi-biryani", name: "Karachi Biryani House", logoText: "K", brand: "#d9471f", locale: "en-PK",
    allowedOrigins: ["https://kbh.example"],
    greeting: "Hi! I'm the Karachi Biryani House assistant. Ask me about the menu, prices, delivery areas or timings, or tell me what you'd like to order.",
    quickReplies: ["Do you deliver to Gulshan-e-Maymar?", "How much is chicken biryani?", "What are your timings?"],
    ownerPhone: "+92 300 1234567", ownerEmail: "orders@kbh.example",
    products: [
      { id: "p_cb", name: "Chicken Biryani", aliases: ["chicken biryani", "biryani"], price: 350, available: true, note: "Rs. 1,300 for the family size that serves 4. It comes with raita and salad." },
      { id: "p_bb", name: "Beef Biryani", aliases: ["beef biryani"], price: 420, available: true },
      { id: "p_mb", name: "Mutton Biryani", aliases: ["mutton biryani"], price: 650, available: true },
      { id: "p_pb", name: "Prawn Biryani", aliases: ["prawn biryani", "prawn"], price: 780, available: false },
      { id: "p_tikka", name: "Chicken Tikka (half)", aliases: ["tikka", "chicken tikka"], price: 480, available: true },
      { id: "p_ck", name: "Chicken Karahi (half kg)", aliases: ["karahi", "chicken karahi"], price: 1450, available: true, note: "Full kg is Rs. 2,750 with 4 naan." },
      { id: "p_naan", name: "Naan", aliases: ["naan"], price: 40, available: true },
      { id: "p_raita", name: "Raita", aliases: ["raita"], price: 60, available: true },
      { id: "p_cola", name: "Soft Drink (1.5L)", aliases: ["drink", "cola", "soft drink"], price: 180, available: true },
    ],
    zones: [
      { name: "Gulshan-e-Maymar", aliases: ["maymar", "gulshan-e-maymar", "gulshan e maymar"], charge: 100, etaMins: 40 },
      { name: "Gulshan-e-Iqbal", aliases: ["gulshan-e-iqbal", "gulshan e iqbal", "gulshan iqbal"], charge: 150, etaMins: 50 },
      { name: "Gulistan-e-Johar", aliases: ["johar"], charge: 150, etaMins: 55 },
      { name: "North Nazimabad", aliases: ["nazimabad"], charge: 200, etaMins: 60 },
    ],
    hours: "Open daily 12:00 to 23:30. Friday we open at 13:30. Weekends until 00:30.",
    minOrder: 500,
  },
];

export const findBusinessByKey = (key: string | undefined) => businesses.find((b) => b.key === key);
