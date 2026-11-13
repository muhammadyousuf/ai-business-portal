"use client";
import { appointmentStatus } from "@assistflow/shared/lib/status";
import { CrossOrgList } from "@/components/cross-org-list";
export default function Page() { return <CrossOrgList kind="appointments" title="All appointments" description="Appointment and booking requests across organizations." statusMap={appointmentStatus} />; }
