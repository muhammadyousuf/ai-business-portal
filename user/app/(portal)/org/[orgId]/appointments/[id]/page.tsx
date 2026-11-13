"use client";
import { appointmentStatus, APPT_FLOW } from "@assistflow/shared/lib/status";
import { IntakeDetail } from "@/components/intake";
export default function Page() { return <IntakeDetail kind="appointments" label="Appointment" statusMap={appointmentStatus} flow={APPT_FLOW} />; }
