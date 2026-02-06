import Profile from "@/components/admin/Profile";
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  Group,
  Text,
} from "@mantine/core";
import SettingsButton from "@/components/admin/AdminSettingsButton";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell padding="md" header={{ height: 64 }}>
      <AppShellHeader px="md">
        <Group h="100%" justify="space-between">
          <Text fw={700} c="blue.9">
            Beantown Baby Admin
          </Text>

          <Group gap="xs">
            <Profile />
            <SettingsButton />
          </Group>
        </Group>
      </AppShellHeader>
      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}