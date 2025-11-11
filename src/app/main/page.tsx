"use client";

const LeafletMap = dynamic(() => import("@/components/map/Map"), {
  ssr: false,
});

import { Paper, Box, Stack, Card, Title } from "@mantine/core";
import dynamic from "next/dynamic";

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
