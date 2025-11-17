"use client";
import TimelineSliderControls from "@/components/TimelineSliderControls";
import { Box, Center, Paper, Stack, Title } from "@mantine/core";

export default function Page() {
  return (
    <Stack align="space-between">
      <Paper
        p="xl"
        radius="md"
        withBorder>
        <Title>Epic 2 Sprint 1 Page</Title>
      </Paper>
      <Paper
        mt="md"
        p="xl"
        radius="md"
        withBorder>
        <Center>
          <Title order={2}>Map will go here</Title>
        </Center>
        <Box h={500}></Box>
      </Paper>
      <Paper
        p="xl"
        radius="md"
        withBorder>
        <Stack>
          <Title order={2}>Timeline Slider</Title>
          <TimelineSliderControls />
        </Stack>
      </Paper>
    </Stack>
  );
}
