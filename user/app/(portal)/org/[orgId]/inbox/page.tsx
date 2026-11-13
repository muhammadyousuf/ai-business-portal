"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@assistflow/shared/api/hooks";
import { Loading } from "@assistflow/shared/components/states";
import { useOrg } from "@/lib/org-context";
import { InboxList } from "@/components/inbox-list";

export default function InboxIndex() {
  const { org, base } = useOrg(); const router = useRouter();
  const { data } = useApi<{ items: { id: string }[] }>(`/v1/orgs/${org.uuid}/conversations?status=open&limit=1`);
  useEffect(() => { if (data?.items[0]) router.replace(`${base}/inbox/${data.items[0].id}`); }, [data, router, base]);
  if (!data) return <Loading />;
  return <InboxList />;
}
