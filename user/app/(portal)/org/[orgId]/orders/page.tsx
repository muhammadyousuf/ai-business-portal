"use client";
import { orderStatus, ORDER_FLOW } from "@assistflow/shared/lib/status";
import { IntakeList } from "@/components/intake";
export default function Page() { return <IntakeList kind="orders" title="Orders" description="Orders collected by the chatbot. Confirm, update and complete them here." statusMap={orderStatus} flow={ORDER_FLOW} />; }
