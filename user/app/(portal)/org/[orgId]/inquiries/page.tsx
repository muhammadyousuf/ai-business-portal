"use client";
import { inquiryStatus, INQ_FLOW } from "@assistflow/shared/lib/status";
import { IntakeList } from "@/components/intake";
export default function Page() { return <IntakeList kind="inquiries" title="Inquirys" description="Admission, membership and general inquiries from the chatbot." statusMap={inquiryStatus} flow={INQ_FLOW} />; }
