"use client";
import { inquiryStatus } from "@assistflow/shared/lib/status";
import { CrossOrgList } from "@/components/cross-org-list";
export default function Page() { return <CrossOrgList kind="inquiries" title="All inquiries" description="Admission, membership and general inquiries across organizations." statusMap={inquiryStatus} />; }
