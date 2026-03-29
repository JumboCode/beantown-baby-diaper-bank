import Profile from "@/components/admin/Profile";
import SettingsButton from "@/components/admin/AdminSettingsButton";
import { auth } from "@clerk/nextjs/server";
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  Group,
  Text,
} from "@mantine/core";
import Link from "next/link";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;
  const canAccessAdminControls = role === "superadmin";

  return (
    <AppShell padding="md" header={{ height: 64 }}>
      <AppShellHeader px="md">
        <Group h="100%" justify="space-between">
          <Text fw={700} c="blue.9">
            Beantown Baby Admin
          </Text>

          <Group gap="xs">
            <Link href="/">
              View Map
            </Link>
            <Profile />
            {canAccessAdminControls ? <SettingsButton /> : null}
          </Group>
        </Group>
      </AppShellHeader>
      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}
