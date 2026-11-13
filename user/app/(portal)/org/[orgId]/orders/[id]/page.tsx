"use client";
import { orderStatus, ORDER_FLOW } from "@assistflow/shared/lib/status";
import { IntakeDetail } from "@/components/intake";
export default function Page() { return <IntakeDetail kind="orders" label="Order" statusMap={orderStatus} flow={ORDER_FLOW} />; }
