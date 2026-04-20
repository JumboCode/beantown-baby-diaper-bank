"use client";

import { Center, Stack, Title, Text, Button, ThemeIcon, Group } from "@mantine/core";
import { IconAlertTriangle, IconMap, IconRefresh } from "@tabler/icons-react";
import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Center h="100vh" bg="gray.0">
      <Stack align="center" ta="center" gap="md">
        <ThemeIcon size={120} radius="xl" variant="light" color="brandRed">
          <IconAlertTriangle size={80} stroke={1.5} />
        </ThemeIcon>
        <Title order={1} c="var(--mantine-color-brand-9)" size="h1">
          Something went wrong
        </Title>
        <Text c="dimmed" maw={500} size="lg">
          An unexpected error occurred while loading the map. Please try again later.
        </Text>
        <Group mt="xl">
          <Button
            onClick={reset}
            variant="filled"
            color="brand"
            size="md"
            leftSection={<IconRefresh size={18} />}
          >
            Try again
          </Button>
          <Button
            component={Link}
            href="/"
            variant="default"
            size="md"
            leftSection={<IconMap size={18} />}
            c="var(--mantine-color-brand-9)"
          >
            Reload Map
          </Button>
        </Group>
      </Stack>
    </Center>
  );
}
