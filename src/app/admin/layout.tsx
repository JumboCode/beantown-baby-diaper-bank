import Profile from "@/components/admin/Profile";
import { ClerkProvider } from "@clerk/nextjs";
import { AppShell, AppShellHeader, AppShellMain, Button, Group } from "@mantine/core";
import { MapIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <AppShell header={{ height: "80" }}>
        <AppShellHeader px="sm">
          <Group h="100%" justify="space-between" align="flex-start" p={"sm"}>
            <Link href="/admin" style={{ textDecoration: "none" }}>
              <Image
                src="/beantown-logo.svg"
                alt="Beantown Baby Diaper Bank"
                height={200}
                width={200}
              />
            </Link>

            <Group gap="xs" p="md">
              <Button leftSection={<MapIcon />} size="sm">
                <Link href="/">View Hot Map</Link>
              </Button>
              <Profile />
            </Group>
          </Group>
        </AppShellHeader>
        <AppShellMain>{children}</AppShellMain>
      </AppShell>
    </ClerkProvider>
  );
}
