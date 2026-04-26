"use client";

import { Button, Center, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { useClerk, useUser } from "@clerk/nextjs";
import { IconLock, IconMap, IconMail } from "@tabler/icons-react";
import Link from "next/link";

const adminContactEmail = process.env.NEXT_PUBLIC_ADMIN_CONTACT_EMAIL;

export default function Page() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "No email on file";

  const role =
    (typeof user?.publicMetadata?.role === "string" && user.publicMetadata.role) || "member";
  const requestAccessSubject = "Request admin access";
  const requestAccessBody = `Hello,\n\nI would like to request access to the admin page.\n\nAccount email: ${primaryEmail}\nCurrent role: ${role}\n\nThanks,`;
  const requestAccessHref = adminContactEmail
    ? `mailto:${adminContactEmail}?subject=${encodeURIComponent(
        requestAccessSubject,
      )}&body=${encodeURIComponent(requestAccessBody)}`
    : null;

  return (
    <Center h="100vh" bg="gray.0">
      <Stack align="center" ta="center" gap="md">
        <ThemeIcon size={120} radius="xl" variant="light" color="brandRed">
          <IconLock size={80} stroke={1.5} />
        </ThemeIcon>
        <Title order={1} c="var(--mantine-color-brand-9)" size="h1">
          Access Denied
        </Title>
        <Text c="dimmed" maw={500} size="lg">
          You don&apos;t have permission to view this page.
        </Text>
        {isLoaded && (
          <Text c="dimmed" size="sm">
            Signed in as <strong>{primaryEmail}</strong> ({role})
          </Text>
        )}
        <Group mt="xl">
          <Button
            component={Link}
            href="/"
            variant="filled"
            color="brand"
            size="md"
            leftSection={<IconMap size={18} />}
          >
            Go to Map
          </Button>
          {requestAccessHref && (
            <Button
              component="a"
              href={requestAccessHref}
              variant="default"
              size="md"
              leftSection={<IconMail size={18} />}
              c="var(--mantine-color-brand-9)"
            >
              Request Access
            </Button>
          )}
          <Button
            variant="default"
            size="md"
            onClick={() => signOut()}
            c="var(--mantine-color-brand-9)"
          >
            Sign Out
          </Button>
        </Group>
      </Stack>
    </Center>
  );
}
