import { useEffect, useState } from "react";
import TimelineSlider from "./TimelineSlider";
import { Group, ActionIcon, Box, Tooltip, Paper } from "@mantine/core";
import {
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconChevronLeft,
  IconChevronRight,
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
  const isAtStart = index <= 0;
  const isAtEnd = index >= labels.length - 1;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isPlaying) {
      interval = setInterval(() => {
        if (index >= labels.length - 1) {
          setIsPlaying(false);
        } else {
          move(1);
        }
      }, 1200);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [index, isPlaying, labels.length, move]);

  useEffect(() => {
    const label = labels[index];
    if (!label || !onTimelineChange) return;

    const timeoutId = window.setTimeout(() => {
      if (view === "monthly") {
        const [month, year] = label.toString().split(" ");
        if (month && year) onTimelineChange({ month, year });
      } else {
        onTimelineChange({ year: label.toString() });
      }
    }, 140);

    return () => window.clearTimeout(timeoutId);
  }, [index, view, labels, onTimelineChange]);

  return (
    <Paper
      withBorder
      radius="xl"
      px="md"
      py="md"
      style={{
        background: "rgba(255, 255, 255, 0.96)",
        boxShadow: "0 10px 24px rgba(16, 24, 40, 0.06)",
      }}
    >
      <Group justify="space-between" align="flex-end" wrap="nowrap">
        <Group gap={6} align="center" style={{ flexShrink: 0 }}>
          <Tooltip label="Previous year" withArrow>
            <ActionIcon
              color="#053766"
              variant="subtle"
              radius="xl"
              size="sm"
              onClick={() => move(-1)}
              disabled={isAtStart}
              aria-label="Previous step"
              title="Previous step"
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={isPlaying ? "Pause timeline" : "Play timeline"} withArrow>
            <ActionIcon
              color={isPlaying ? "#e33940" : "#053766"}
              variant="filled"
              radius="xl"
              size="md"
              onClick={() => {
                if (isAtEnd && !isPlaying) {
                  setIndex(0);
                }
                setIsPlaying(!isPlaying);
              }}
              disabled={labels.length === 0}
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
              size="sm"
              onClick={() => move(1)}
              disabled={isAtEnd}
              aria-label="Next step"
              title="Next step"
            >
              <IconChevronRight size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Box style={{ flex: 1, minWidth: 0 }} px="0 8 ">
          <TimelineSlider
            labels={labels}
            value={index}
            setValue={setIndex}
            isPlaying={isPlaying}
          />
        </Box>
      </Group>
    </Paper>
  );
}
