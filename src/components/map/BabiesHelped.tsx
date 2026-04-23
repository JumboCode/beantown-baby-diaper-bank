"use client";
import { Box, Group, Stack, Text, Skeleton } from "@mantine/core";
import { IconBabyCarriageFilled } from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks";
import { useCountUp } from "./useCountUp";

interface BabiesHelpedProps {
  babiesHelped?: number;
  year?: string;
}

export default function BabiesHelped({ babiesHelped, year }: BabiesHelpedProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const animatedCount = useCountUp(babiesHelped, 1400);

  return (
    <Box
      style={{
        background: "#1B3668",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(27, 54, 104, 0.4)",
        padding: isMobile ? "8px 12px" : "10px 18px",
        minWidth: isMobile ? 0 : 240,
        pointerEvents: "none",
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap={isMobile ? 8 : 12}>
        <Stack gap={isMobile ? 1 : 2}>
          <Text
            fz={isMobile ? "9px" : "10px"}
            fw={700}
            c="rgba(255,255,255,0.55)"
            tt="uppercase"
            lts="0.1em"
          >
            {isMobile ? "Babies Helped" : `Babies Helped${year ? ` in ${year}` : ""}`}
          </Text>
          {babiesHelped != null ? (
            <Text fz={isMobile ? "22px" : "28px"} fw={900} c="white" lh={1}>
              ~{animatedCount.toLocaleString()}
            </Text>
          ) : (
            <Skeleton
              height={isMobile ? 28 : 36}
              width={120}
              radius="sm"
              style={{ marginTop: 2 }}
            />
          )}
          {isMobile && (
            <Text fz="8px" fw={600} c="rgba(255,255,255,0.5)" tt="uppercase" lts="0.05em">
              estimated
            </Text>
          )}
        </Stack>
        {!isMobile && (
          <IconBabyCarriageFilled size={36} color="white" style={{ flexShrink: 0, marginTop: 2 }} />
        )}
      </Group>
    </Box>
  );
}
