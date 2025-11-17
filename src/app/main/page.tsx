"use client";

import LeafletMap from "@/components/map/Map";
import { Paper, Box, Stack, Card, Title } from "@mantine/core";

export default function Page() {
  return (
    <Stack>
      <Card shadow="md">
        <Title>Map Component Page</Title>
      </Card>
      <Paper>
        <Box h="80vh">
          <LeafletMap />
        </Box>
      </Paper>
    </Stack>
  );
}
