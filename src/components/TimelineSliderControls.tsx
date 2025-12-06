import { useEffect } from "react";
import TimelineSlider from "./TimelineSlider";
import { Group, Stack, ActionIcon } from "@mantine/core";

export default function TimelineSliderControls({
  view,
  index,
  setIndex,
  labels,
  toggleView,
  move,
  onTimelineChange,
}: {
  view: "monthly" | "yearly";
  index: number;
  labels: (string | number)[];
  setIndex: (n: number) => void;
  toggleView: () => void;
  move: (dir: number) => void;
  onTimelineChange?: (params: { month?: string; year: string }) => void;
}) {
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
      <Group align="flex-end">
        <ActionIcon color="#053766" onClick={() => move(-1)}>
          <img src="/timelineSlider/left.svg" />
        </ActionIcon>

        <div className="flex-1 px-5">
          <TimelineSlider labels={labels} value={index} setValue={setIndex} />
        </div>

        <ActionIcon color="#053766" onClick={() => move(1)}>
          <img src="/timelineSlider/right.svg" />
        </ActionIcon>
      </Group>
    </Stack>
  );
}
