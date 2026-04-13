"use client";

import Link from "next/link";
import { Center, Stack, Title, Text, Group, Button, ThemeIcon } from "@mantine/core";
import { IconMap, IconLock, IconError404 } from "@tabler/icons-react";

export default function NotFound() {
  return (
    <Center h="100vh" bg="gray.0">
      <Stack align="center" ta="center" gap="md">
        <ThemeIcon size={120} radius="xl" variant="light" color="brandRed">
          <IconError404 size={80} stroke={1.5} />
        </ThemeIcon>
        <Title order={1} c="var(--mantine-color-brand-9)" size="h1">
          Page Not Found
        </Title>
        <Text c="dimmed" maw={500} size="lg">
          Oops! The page you&apos;re looking for doesn&apos;t exist.
        </Text>
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
          <Button
            component={Link}
            href="/admin"
            variant="default"
            size="md"
            leftSection={<IconLock size={18} />}
            c="var(--mantine-color-brand-9)"
          >
            Admin Dashboard
          </Button>
        </Group>
      </Stack>
    </Center>
  );
}
