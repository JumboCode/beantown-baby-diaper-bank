import { Avatar, Tooltip } from "@mantine/core";
import type { status } from "@/generated/prisma/client";

interface PartnerAvatarProps {
  id: number;
  name: string;
  url: string | null | undefined;
  status: status;
  onClick: () => void;
}

export default function PartnerAvatar({
  name,
  url,
  onClick,
}: PartnerAvatarProps) {
  return (
    <Tooltip label={name} withArrow>
      <Avatar
        src={url}
        size="md"
        radius="xl"
        color="blue"
        variant="light"
        style={{ cursor: "pointer" }}
        onClick={onClick}
      >
        {name.substring(0, 2).toUpperCase()}
      </Avatar>
    </Tooltip>
  );
}
