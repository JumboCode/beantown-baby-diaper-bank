"use client";
import { Paper, Stack, Text, Group } from "@mantine/core";
import Image from "next/image";
// import ImpactModal from "./ImpactModal";

interface TotalDiapersDistributedProps {
  totalDiapers: number;
}

export default function TotalDiapersDistributed({
  totalDiapers,
}: TotalDiapersDistributedProps) {
  return (
    <Paper
      shadow="md"
      p="lg"
      radius="md"
      style={{ backgroundColor: "#B8D4E8" }}>
      <Group
        justify="space-between"
        align="center">
        <Stack gap="xs">
          <Text
            size="sm"
            c="dimmed"
            fw={500}>
            Total Diapers Distributed
          </Text>
          <Text
            size="xl"
            fw={700}>
            {totalDiapers.toLocaleString()}
          </Text>
        </Stack>
        <Image
          src="/diaper.svg"
          alt="Diaper icon"
          width={60}
          height={60}
        />
      </Group>
    </Paper>
  );
}
