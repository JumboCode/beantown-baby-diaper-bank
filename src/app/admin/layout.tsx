import AdminSettingsButton from "@/components/admin/AdminSettingsButton";
import { UserButton } from "@clerk/nextjs";
import { AppShell, AppShellHeader, AppShellMain, Button, Group, Skeleton } from "@mantine/core";
import { MapIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell header={{ height: "10vh" }}>
      <AppShellHeader px="sm">
        <Group h="100%" justify="space-between" align="flex-start" p={"sm"}>
          <Link href="/admin" style={{ textDecoration: "none" }}>
            <Image
              src="/beantown-logo.svg"
              alt="Beantown Baby Diaper Bank"
              height={200}
              width={200}
              priority
              style={{ height: "auto" }}
            />
          </Link>

          <Group gap="lg" p="md">
            <Button component="a" href="/" leftSection={<MapIcon />} size="sm">
              View Hot Map
            </Button>
            <UserButton fallback={<Skeleton height={28} width={28} radius="xl" />} />

            <AdminSettingsButton />
          </Group>
        </Group>
      </AppShellHeader>
      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}
