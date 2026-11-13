"use client";
import { appointmentStatus, APPT_FLOW } from "@assistflow/shared/lib/status";
import { IntakeList } from "@/components/intake";
export default function Page() { return <IntakeList kind="appointments" title="Appointments" description="Appointment and booking requests from the chatbot." statusMap={appointmentStatus} flow={APPT_FLOW} />; }
