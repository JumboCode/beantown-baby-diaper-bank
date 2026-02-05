import Profile from "@/components/admin/Profile";
import Image from "next/image"; // Import for the custom SVG
import Link from "next/link"; // Import for navigation
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  Group,
  Text,
  ActionIcon,
} from "@mantine/core";

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
            {/* New Settings Button with custom SVG */}
            <ActionIcon 
              component={Link} 
              href="/admincontrols" 
              variant="subtle" 
              color="gray"
              size="lg"
            >
              <Image 
                src="/admin_view/settings.svg" 
                alt="Settings" 
                width={20} 
                height={20} 
              />
            </ActionIcon>
          </Group>
        </Group>
      </AppShellHeader>
      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}