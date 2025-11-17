"use client";
import TimelineSliderControls from "@/components/TimelineSliderControls";
import { Box, Center, Paper, Stack, Title } from "@mantine/core";

import PartnerInfo from "./partnerInfo";
import LeafletMap from "@/components/map/Map";

export default function Page() {
  return (
    <Stack align="space-between">
      <Paper
        p="xl"
        radius="md"
        withBorder>
        <Title>Epic 2 Sprint 1 Page</Title>
      </Paper>
      <Paper>
        <PartnerInfo />
      </Paper>
      <Paper
        mt="md"
        p="xl"
        radius="md"
        withBorder>
        <Box h={600}>
          <LeafletMap />
        </Box>
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
