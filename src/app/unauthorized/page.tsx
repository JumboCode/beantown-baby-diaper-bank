"use client";

import { Button, Card, Divider, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { useClerk, useUser } from "@clerk/nextjs";
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
  const requestAccessBody = `Hello,

I would like to request access to the admin page.

Account email: ${primaryEmail}
Current role: ${role}

Thanks,`;
  const requestAccessHref = adminContactEmail
    ? `mailto:${adminContactEmail}?subject=${encodeURIComponent(
        requestAccessSubject,
      )}&body=${encodeURIComponent(requestAccessBody)}`
    : null;

  return (
    <Stack
      align="center"
      justify="center"
      mih="100vh"
      px="lg"
      style={{ background: "linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 70%)" }}
    >
      <Card padding="xl" radius="lg" withBorder shadow="sm" maw={520} w="100%">
        <Stack gap="md">
          <Group gap="sm" align="center">
            <ThemeIcon size={44} radius="xl" color="blue" variant="light">
              !
            </ThemeIcon>
            <Stack gap={0}>
              <Title order={2}>Access denied</Title>
              <Text c="dimmed" size="sm">
                You are signed in, but your account does not have admin access.
              </Text>
            </Stack>
          </Group>

          {isLoaded && (
            <Stack gap={4}>
              <Text size="sm" c="dimmed">
                Signed in as
              </Text>
              <Text fw={600}>
                {primaryEmail}{" "}
                <Text span c="dimmed">
                  ({role})
                </Text>
              </Text>
            </Stack>
          )}

          <Divider />

          <Group gap="sm" wrap="wrap">
            <Button variant="filled" onClick={() => signOut({ redirectUrl: "/admin/sign-in" })}>
              Sign in with a different account
            </Button>
            {requestAccessHref && (
              <Button component="a" href={requestAccessHref} variant="light">
                Request admin access
              </Button>
            )}
            <Button component={Link} href="/" variant="subtle">
              Return home
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
