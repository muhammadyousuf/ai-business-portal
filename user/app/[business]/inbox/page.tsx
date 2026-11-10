import { redirect } from "next/navigation";
import { conversations } from "@assistflow/shared/mock/business";

export default async function InboxIndex({ params }: { params: Promise<{ business: string }> }) {
  const { business } = await params;
  const first = conversations.find((c) => c.status === "needs_attention") ?? conversations[0];
  redirect(`/${business}/inbox/${first.id}`);
}
