"use client";
import { orderStatus } from "@assistflow/shared/lib/status";
import { CrossOrgList } from "@/components/cross-org-list";
export default function Page() { return <CrossOrgList kind="orders" title="All orders" description="Orders collected by chatbots across organizations." statusMap={orderStatus} />; }
