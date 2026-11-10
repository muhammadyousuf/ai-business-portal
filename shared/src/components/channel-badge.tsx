import { Globe, MessageCircle } from "lucide-react";
import { InstagramIcon, MessengerIcon } from "./brand-icons";
import { channelLabel } from "../lib/status";
import { cn } from "../lib/utils";

const meta = {
  website: { Icon: Globe, cls: "bg-info-soft text-info" },
  whatsapp: { Icon: MessageCircle, cls: "bg-success-soft text-success" },
  messenger: { Icon: MessengerIcon, cls: "bg-brand-soft text-brand" },
  instagram: { Icon: InstagramIcon, cls: "bg-warning-soft text-warning" },
};

export function ChannelBadge({ channel, withLabel = true, className }: { channel: keyof typeof meta; withLabel?: boolean; className?: string }) {
  const { Icon, cls } = meta[channel];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium", cls, className)} title={channelLabel[channel]}>
      <Icon className="size-3" />
      {withLabel ? channelLabel[channel] : null}
    </span>
  );
}
