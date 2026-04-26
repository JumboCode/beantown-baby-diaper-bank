"use client";

import { ActionIcon } from "@mantine/core";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function AdminSettingsButton() {
  const { user } = useUser();

  const currentRole =
    typeof user?.publicMetadata?.role === "string" ? user.publicMetadata.role : "user";
  const canDeleteAdmins = currentRole === "superadmin" || currentRole === "admin";

  if (!canDeleteAdmins) {
    return null;
  }

  return (
    <ActionIcon component={Link} href="/admin/controls" variant="subtle" color="gray" size="lg">
      <Image src="/admin_view/settings.svg" alt="Settings" width={20} height={20} />
    </ActionIcon>
  );
}
