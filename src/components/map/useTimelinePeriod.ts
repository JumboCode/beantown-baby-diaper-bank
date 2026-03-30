import { useCallback, useEffect, useMemo, useState } from "react";

type TimelineResponse = {
  years: number[];
  months: { Month: string; Year: number }[];
};

export type TimelineView = "monthly" | "yearly";

export function useTimelinePeriod() {
  const [view, setView] = useState<TimelineView>("yearly");
  const [index, setIndex] = useState(0);
  const [years, setYears] = useState<string[]>([]);
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/timeline-slider")
      .then((r) => r.json())
      .then((data: TimelineResponse) => {
        const yearLabels = (data.years ?? []).map(String);
        setYears(yearLabels);
        const monthLabels = (data.months ?? [])
          .map((m) => ({ ...m, date: new Date(`${m.Month} 1, ${m.Year}`) }))
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((m) => `${m.Month} ${m.Year}`);
        setMonths(monthLabels);
        const defaultIndex = yearLabels.indexOf("2026");
        setIndex(defaultIndex !== -1 ? defaultIndex : yearLabels.length - 1);
      })
      .catch((err) => console.error("timeline fetch failed", err));
  }, []);

  const labels = useMemo(
    () => (view === "monthly" ? months : years),
    [view, months, years],
  );
  const length = labels.length;

  const toggleView = useCallback(() => {
    setView((prev) => (prev === "monthly" ? "yearly" : "monthly"));
    setIndex(0);
  }, []);

  const move = useCallback(
    (dir: number) => {
      if (dir === 0) return;
      setIndex((prev) => {
        const maxIndex = Math.max(0, length - 1);
        if (dir > 0) return Math.min(prev + 1, maxIndex);
        return Math.max(prev - 1, 0);
      });
    },
    [length],
  );

  return {
    view,
    index,
    setIndex,
    toggleView,
    move,
    length: labels.length,
    labels,
    months,
    years,
    value: labels[index],
    setValue: (val: string) => {
      const newIndex = labels.indexOf(val);
      if (newIndex !== -1) {
        setIndex(newIndex);
      }
    },
  };
}
