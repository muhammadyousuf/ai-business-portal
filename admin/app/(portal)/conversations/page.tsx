"use client";
import { conversationStatus } from "@assistflow/shared/lib/status";
import { CrossOrgList } from "@/components/cross-org-list";
export default function Page() { return <CrossOrgList kind="conversations" title="All conversations" description="Every customer conversation across organizations. Read-only; reads are logged." statusMap={conversationStatus} />; }
