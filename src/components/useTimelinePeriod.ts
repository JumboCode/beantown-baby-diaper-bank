// src/components/useTimelinePeriod.ts
import { useCallback, useMemo, useState } from "react";

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const MONTHS = [
  "January 2025",
  "February 2025",
  "March 2025",
  "April 2025",
  "May 2025",
  "June 2025",
  "July 2025",
  "August 2025",
  "September 2025",
];

export type TimelineView = "monthly" | "yearly";

export function useTimelinePeriod() {
  const [view, setView] = useState<TimelineView>("monthly");
  const [index, setIndex] = useState(0);

  const labels = useMemo(
    () => (view === "monthly" ? MONTHS : YEARS.map(String)),
    [view],
  );
  const length = labels.length;

  const toggleView = useCallback(() => {
    setView((prev) => (prev === "monthly" ? "yearly" : "monthly"));
    // reset index when switching view (or use length - 1 if you prefer)
    setIndex(0);
  }, []);

  const move = useCallback(
    (dir: number) => {
      if (dir === 0) return;
      const maxIndex = length - 1;

      setIndex((prev) => {
        if (dir > 0) {
          return prev >= maxIndex ? prev : prev + 1;
        } else {
          return prev <= 0 ? prev : prev - 1;
        }
      });
    },
    [length],
  );

  return {
    view, // "monthly" | "yearly"
    index, // current index
    setIndex, // setter
    toggleView,
    move,
    length, // number of months or years
    labels,
  };
}
