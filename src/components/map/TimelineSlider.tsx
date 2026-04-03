"use client";
import { useEffect, useState } from "react";
import { Group, Stack, ActionIcon, Box, Text, Tooltip, Slider } from "@mantine/core";
import Image from "next/image";
import {
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import LastUploaded from "@/app/LastUploaded";

export default function TimelineSlider({
  index,
  setIndex,
  labels,
  move,
  onTimelineChange,
}: {
  index: number;
  labels: string[];
  setIndex: (n: number) => void;
  move: (dir: number) => void;
  onTimelineChange?: (year: string) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (index >= labels.length - 1) {
        setIsPlaying(false);
      } else {
        move(1);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [index, isPlaying, labels.length, move]);

  useEffect(() => {
    const label = labels[index];
    if (label && onTimelineChange) onTimelineChange(label);
  }, [index, labels, onTimelineChange]);

  if (!labels || labels.length === 0) return <Box h={50} />;

  const maxPoints = labels.length - 1;
  const markStep = labels.length <= 8 ? 1 : labels.length <= 12 ? 2 : Math.ceil(labels.length / 6);
  const marks = labels.map((label, idx) => ({
    value: idx,
    label:
      idx === 0 || idx === maxPoints || idx === index || idx % markStep === 0 ? label : undefined,
  }));

  return (
    <Stack gap="sm" mb="xs">
      <Group justify="space-between" align="flex-end" gap="md" wrap="wrap">
        <Box>
          <Text fz="18px" fw={700} c="#101828">
            Explore distribution data by year
          </Text>
          <Group align="center" gap={6} mb={4}>
            <Text fz="13px" c="#667085">
              Step through each year or play the timeline to follow distribution growth over time.
            </Text>
            <LastUploaded />
          </Group>
        </Box>

        <Group
          gap={8}
          p={6}
          style={{
            border: "1px solid #D0D5DD",
            borderRadius: 999,
            background: "#FFFFFF",
            boxShadow: "0 6px 18px rgba(16, 24, 40, 0.08)",
          }}
        >
          <Tooltip label="Previous year" withArrow>
            <ActionIcon
              color="#053766"
              variant="subtle"
              radius="xl"
              size="lg"
              onClick={() => move(-1)}
              aria-label="Previous year"
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={isPlaying ? "Pause timeline" : "Play timeline"} withArrow>
            <ActionIcon
              color={isPlaying ? "#e3393e" : "#053766"}
              variant="filled"
              radius="xl"
              size="lg"
              onClick={() => {
                if (index >= labels.length - 1 && !isPlaying) setIndex(0);
                setIsPlaying(!isPlaying);
              }}
              aria-label={isPlaying ? "Pause timeline" : "Play timeline"}
            >
              {isPlaying ? <IconPlayerPauseFilled size={18} /> : <IconPlayerPlayFilled size={18} />}
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Next year" withArrow>
            <ActionIcon
              color="#053766"
              variant="subtle"
              radius="xl"
              size="lg"
              onClick={() => move(1)}
              aria-label="Next year"
            >
              <IconChevronRight size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Box
        p="md"
        style={{
          border: "1px solid #E4E7EC",
          borderRadius: 18,
          background: "linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        <Box style={{ position: "relative", width: "100%", paddingTop: 10, paddingBottom: 12 }}>
          <Slider
            min={0}
            max={maxPoints}
            value={index}
            onChange={setIndex}
            step={1}
            size="lg"
            label={(val) => labels[val] ?? ""}
            labelAlwaysOn
            marks={marks}
            color="#053766"
            thumbSize={36}
            thumbChildren={
              <Image
                src="/bbdb.jpg"
                alt="Timeline marker"
                width={36}
                height={36}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            }
            styles={{
              root: { paddingLeft: 6, paddingRight: 6 },
              track: { height: 8 },
              bar: {
                background: "linear-gradient(90deg, #143E6E 0%, #0F6B99 100%)",
                transition: "width 220ms ease",
              },
              mark: {
                width: 8,
                height: 8,
                border: "2px solid #FFFFFF",
                backgroundColor: "#D0D5DD",
                top: "50%",
                transform: "translateY(-50%)",
              },
              markLabel: { marginTop: 10, fontSize: 15, fontWeight: 700, color: "#667085" },
              thumb: {
                borderRadius: "50%",
                overflow: "hidden",
                padding: 0,
                border: "2px solid #FFFFFF",
                boxShadow: "0 4px 12px rgba(5, 55, 102, 0.22)",
                transition: "left 220ms ease, transform 220ms ease, box-shadow 220ms ease",
              },
              label: {
                backgroundColor: "#FFFFFF",
                border: "1px solid #D0D5DD",
                borderRadius: 999,
                color: "#053766",
                fontWeight: 800,
                padding: "6px 10px",
                boxShadow: "0 6px 18px rgba(16, 24, 40, 0.12)",
                transition: "left 220ms ease, transform 220ms ease, opacity 180ms ease",
              },
            }}
          />
        </Box>
      </Box>
    </Stack>
  );
}
