import { useEffect } from "react";
import TimelineSlider from "./TimelineSlider";
import { Group, Stack, ActionIcon } from "@mantine/core";
import YearlyMonthlySwitch from "./sprint2/YearlyMonthlySwitch";

export default function TimelineSliderControls({
  view,
  index,
  setIndex,
  toggleView,
  move,
  onTimelineChange,
}: {
  view: "monthly" | "yearly";
  index: number;
  setIndex: (n: number) => void;
  toggleView: () => void;
  move: (dir: number) => void;
  onTimelineChange?: (params: { month?: string; year: string }) => void;
}) {
  // Define your data arrays
  const months = [
    { month: "January", year: "2025" },
    { month: "February", year: "2025" },
    { month: "March", year: "2025" },
    { month: "April", year: "2025" },
    { month: "May", year: "2025" },
    { month: "June", year: "2025" },
    { month: "July", year: "2025" },
    { month: "August", year: "2025" },
    { month: "September", year: "2025" },
    { month: "October", year: "2025" },
    { month: "November", year: "2025" },
    { month: "December", year: "2025" },
  ];

  const years = [
    "2018",
    "2019",
    "2020",
    "2021",
    "2022",
    "2023",
    "2024",
    "2025",
  ];

  // Trigger API update whenever index or view changes
  useEffect(() => {
    if (view === "monthly") {
      const selectedMonth = months[index];
      if (selectedMonth && onTimelineChange) {
        onTimelineChange({
          month: selectedMonth.month,
          year: selectedMonth.year,
        });
      }
    } else {
      const selectedYear = years[index];
      if (selectedYear && onTimelineChange) {
        onTimelineChange({
          year: selectedYear,
        });
      }
    }
  }, [index, view]);

  return (
    <Stack>
      <h1 style={{ color: "#21325b", fontWeight: 700 }}>Timeline Slider</h1>

      <YearlyMonthlySwitch value={view} onChange={toggleView} />

      <Group align="flex-end">
        <ActionIcon color="#053766" onClick={() => move(-1)}>
          <img src="/timelineSlider/left.svg" />
        </ActionIcon>

        <div className="flex-1 px-5">
          <TimelineSlider
            monthlyOrYearly={view}
            value={index}
            setValue={setIndex}
          />
        </div>

        <ActionIcon color="#053766" onClick={() => move(1)}>
          <img src="/timelineSlider/right.svg" />
        </ActionIcon>
      </Group>
    </Stack>
  );
}
