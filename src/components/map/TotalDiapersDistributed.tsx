"use client";
import { Paper, Stack, Text, Group, Skeleton } from "@mantine/core";
import Image from "next/image";
// import ImpactModal from "./ImpactModal";

interface TotalDiapersDistributedProps {
  totalDiapers?: number;
  year?: string;
}

export default function TotalDiapersDistributed({
  totalDiapers,
  year,
}: TotalDiapersDistributedProps) {
  return (
    <Paper
      p="md"
      radius="md"
      withBorder
      shadow="md"
    >
      <Group justify="space-between" align="center">
        <Stack gap="xs">
          <Text
            // size="sm"
            fz="16px"
            fw={700}
            c="#344054"
          >
            {year ? `Total Diapers Distributed in ${year}` : "Total Diapers Distributed"}
          </Text>
          {totalDiapers != null ? (
            <Text fz={46} fw={700} c="#101828">
              {totalDiapers.toLocaleString()}
            </Text>
          ) : (
            <Skeleton height={72} width={240} radius="sm" />
          )}
        </Stack>
        <Image src="/diaper.svg" alt="Diaper icon" width={98} height={78.4} />
      </Group>
    </Paper>
  );
}
