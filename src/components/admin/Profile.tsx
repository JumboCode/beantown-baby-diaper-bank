"use client";

import { Group, Text } from "@mantine/core";
import { UserButton, useUser } from "@clerk/nextjs";

export default function Profile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return null;
  }

  const role =
    (typeof user?.publicMetadata?.role === "string" &&
      user.publicMetadata.role) ||
    "member";
  const adminTypeLabel =
    role === "superadmin"
      ? "Super Admin"
      : role === "admin"
        ? "Admin"
        : "Member";

  return (
    <Group gap="xs" wrap="nowrap">
      <UserButton afterSignOutUrl="/" />
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {adminTypeLabel}
      </Text>
    </Group>
  );
}
