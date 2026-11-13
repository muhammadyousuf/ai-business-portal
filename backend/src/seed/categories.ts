import { Category } from "../models/index.js";

export const CATEGORIES = [
  { key: "restaurant", name: "Restaurant", icon: "utensils", description: "Menus, prices, branches, delivery and order collection.", modules: ["branches", "catalog", "qa", "inbox", "orders"], labels: { catalogGroup: "Menu", catalogItem: "Menu item", staff: "Staff", appointment: "Reservation", inquiry: "Inquiry" }, inquiryTypes: ["general"], sortOrder: 10 },
  { key: "hospital", name: "Hospital / Clinic", icon: "stethoscope", description: "Doctors, schedules, fees and appointment requests.", modules: ["branches", "staff", "catalog", "qa", "inbox", "appointments", "inquiries"], labels: { catalogGroup: "Department", catalogItem: "Service", staff: "Doctor", appointment: "Appointment", inquiry: "Inquiry" }, inquiryTypes: ["general", "insurance"], sortOrder: 20 },
  { key: "salon", name: "Salon", icon: "scissors", description: "Services, prices, staff availability and bookings.", modules: ["branches", "staff", "catalog", "qa", "inbox", "appointments"], labels: { catalogGroup: "Service category", catalogItem: "Service", staff: "Staff", appointment: "Booking", inquiry: "Inquiry" }, inquiryTypes: ["general"], sortOrder: 30 },
  { key: "gym", name: "Gym", icon: "dumbbell", description: "Membership plans, trainers, schedules and inquiries.", modules: ["branches", "staff", "catalog", "qa", "inbox", "inquiries", "appointments"], labels: { catalogGroup: "Plan category", catalogItem: "Membership plan", staff: "Trainer", appointment: "Session", inquiry: "Inquiry" }, inquiryTypes: ["membership", "general"], sortOrder: 40 },
  { key: "school", name: "School", icon: "graduation-cap", description: "Programs, courses, teachers and admission inquiries.", modules: ["branches", "staff", "catalog", "qa", "inbox", "inquiries"], labels: { catalogGroup: "Program", catalogItem: "Course", staff: "Teacher", appointment: "Visit", inquiry: "Inquiry" }, inquiryTypes: ["admission", "general"], sortOrder: 50 },
] as const;

export async function seedCategories() {
  for (const c of CATEGORIES) await Category.updateOne({ key: c.key }, { $set: { ...c, modules: [...c.modules], inquiryTypes: [...c.inquiryTypes], isSystem: true, isActive: true } }, { upsert: true });
}
