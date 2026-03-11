import { useEffect, useState, useRef } from "react";
import TimelineSlider from "./TimelineSlider";
import { Group, Stack, ActionIcon } from "@mantine/core";
import { IconPlayerPlayFilled, IconPlayerPauseFilled } from "@tabler/icons-react";

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
  const playingRef = useRef(isPlaying);

  // Keep the ref strictly in sync
  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

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
  }, [isPlaying, labels.length, setIndex]);

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
    <Stack mb="xl">

      <Group align="center" gap="sm">
        <ActionIcon
          color="#053766"
          onClick={() => move(-1)}
          aria-label="Previous step"
          title="Previous step"
        >
          <img src="/timelineSlider/left.svg" alt="Left Button" />
        </ActionIcon>



        <div className="flex-1">
          <TimelineSlider labels={labels} value={index} setValue={setIndex} />
        </div>

        <ActionIcon
          color="#053766"
          onClick={() => move(1)}
          aria-label="Next step"
          title="Next step"
        >
          <img src="/timelineSlider/right.svg" alt="Right Button" />
        </ActionIcon>
        <ActionIcon
          color={isPlaying ? "#E53E3E" : "#053766"}
          variant="filled"
          radius="md"
          size="md"
          onClick={() => {
            if (index >= labels.length - 1 && !isPlaying) {
              setIndex(0); // loop back to start if at the end and clicking play
            }
            setIsPlaying(!isPlaying);
          }}
          aria-label={isPlaying ? "Pause timeline" : "Play timeline"}
          title={isPlaying ? "Pause timeline" : "Play timeline"}
        >
          {isPlaying ? <IconPlayerPauseFilled size={16} /> : <IconPlayerPlayFilled size={16} />}
        </ActionIcon>
      </Group>

    </Stack>
  );
}
