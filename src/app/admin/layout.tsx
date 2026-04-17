import Profile from "@/components/admin/Profile";
import { ClerkProvider } from "@clerk/nextjs";
import { AppShell, AppShellHeader, AppShellMain, Group, Text } from "@mantine/core";
import Link from "next/link";

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <AppShell header={{ height: 116 }}>
        <AppShellHeader px={64}>
          <Group h="100%" justify="space-between">
            <Link href="/admin" style={{ textDecoration: "none" }}>
              <img
              src="/beantown-logo.svg"
              alt="Beantown Baby Diaper Bank"
              style={{ height: 100, width: "auto" }}
            />
            </Link>

            <Group gap="xs">
              <Link href="/">View Map</Link>
              <Profile />
            </Group>
          </Group>
        </AppShellHeader>
        <AppShellMain>{children}</AppShellMain>
      </AppShell>
    </ClerkProvider>
  );
}
