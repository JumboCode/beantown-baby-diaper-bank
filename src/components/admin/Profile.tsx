"use client";

import { Group, Text } from "@mantine/core";
import { UserButton, useUser } from "@clerk/nextjs";
import SettingsButton from "./AdminSettingsButton";

export default function Profile() {
  const { user, isLoaded } = useUser();
  const role =
    (typeof user?.publicMetadata?.role === "string" && user.publicMetadata.role) || "member";
  const adminTypeLabel =
    role === "superadmin" ? "Super Admin" : role === "admin" ? "Admin" : "Member";

  return (
    <>
      {isLoaded ? (
        <Group gap="xs" wrap="nowrap">
          <UserButton afterSignOutUrl="/admin/sign-in" />
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {adminTypeLabel}
          </Text>
          {role === "superadmin" && <SettingsButton />}
        </Group>
      ) : null}
    </>
  );
}
