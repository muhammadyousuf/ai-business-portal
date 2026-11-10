import { Avatar, AvatarFallback } from "../ui/avatar";
import { initials } from "../lib/utils";

export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
