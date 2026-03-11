import { useEffect, useState } from "react";
import TimelineSlider from "./TimelineSlider";
import { Group, Stack, ActionIcon, Box, Text, Badge, Tooltip } from "@mantine/core";
import {
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconChevronLeft,
  IconChevronRight,
  IconClockPlay,
} from "@tabler/icons-react";

export default function TimelineSliderControls({
  view,
  index,
  setIndex,
  labels,
  move,
  onTimelineChange,
}: {
  view: "monthly" | "yearly";
  index: number;
  labels: (string | number)[];
  setIndex: (n: number) => void;
  move: (dir: number) => void;
  onTimelineChange?: (params: { month?: string; year: string }) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const currentLabel = labels[index]?.toString() || "";

  // Handle Play logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isPlaying) {
      interval = setInterval(() => {
        // If we reach the end, stop playing
        if (index >= labels.length - 1) {
          setIsPlaying(false);
        } else {
          move(1);
        }
      }, 1500); // 1.5 seconds per step
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [index, isPlaying, labels.length, move]);

  // Trigger API update whenever index or view changes
  useEffect(() => {
    const label = labels[index];
    if (!label || !onTimelineChange) return;

    if (view === "monthly") {
      const [month, year] = label.toString().split(" ");
      if (month && year) onTimelineChange({ month, year });
    } else {
      onTimelineChange({ year: label.toString() });
    }
  }, [index, view, labels, onTimelineChange]);

  return (
    <Stack gap="sm" mb="xs">
      <Group justify="space-between" align="flex-end" gap="md" wrap="wrap">
        <Box>
          <Group gap={8} mb={4}>
            <Badge
              radius="sm"
              variant="light"
              color="blue"
              leftSection={<IconClockPlay size={12} />}
              styles={{
                root: {
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 800,
                },
              }}
            >
              Timeline
            </Badge>
            <Badge
              radius="xl"
              variant="filled"
              styles={{
                root: {
                  background:
                    "linear-gradient(135deg, #143E6E 0%, #0F6B99 100%)",
                  fontWeight: 800,
                  letterSpacing: "0.03em",
                },
              }}
            >
              {currentLabel}
            </Badge>
          </Group>
          <Text fz="18px" fw={700} c="#101828">
            Scrub distribution data by year
          </Text>
          <Text fz="13px" c="#667085">
            Move year by year or play the timeline to see distribution growth over time.
          </Text>
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
              aria-label="Previous step"
              title="Previous step"
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={isPlaying ? "Pause timeline" : "Play timeline"} withArrow>
            <ActionIcon
              color={isPlaying ? "red" : "#053766"}
              variant="filled"
              radius="xl"
              size="lg"
              onClick={() => {
                if (index >= labels.length - 1 && !isPlaying) {
                  setIndex(0); // loop back to start if at the end and clicking play
                }
                setIsPlaying(!isPlaying);
              }}
              aria-label={isPlaying ? "Pause timeline" : "Play timeline"}
              title={isPlaying ? "Pause timeline" : "Play timeline"}
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
              aria-label="Next step"
              title="Next step"
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
          background:
            "linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        <Box style={{ width: "100%" }}>
          <TimelineSlider labels={labels} value={index} setValue={setIndex} />
        </Box>
      </Box>
    </Stack>
  );
}
