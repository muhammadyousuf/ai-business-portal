"use client";
import { inquiryStatus, INQ_FLOW } from "@assistflow/shared/lib/status";
import { IntakeDetail } from "@/components/intake";
export default function Page() { return <IntakeDetail kind="inquiries" label="Inquiry" statusMap={inquiryStatus} flow={INQ_FLOW} />; }
