import { useCallback, useEffect, useMemo, useState } from "react";

type TimelineResponse = {
  years: number[];
  months: { Month: string; Year: number }[];
};

export type TimelineView = "monthly" | "yearly";

export function useTimelinePeriod() {
  const [view, setView] = useState<TimelineView>("monthly");
  const [index, setIndex] = useState(0);
  const [years, setYears] = useState<string[]>([]);
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/timeline-slider")
      .then((r) => r.json())
      .then((data: TimelineResponse) => {
        setYears((data.years ?? []).map(String));
        const monthLabels = (data.months ?? [])
          .map((m) => ({ ...m, date: new Date(`${m.Month} 1, ${m.Year}`) }))
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((m) => `${m.Month} ${m.Year}`);
        setMonths(monthLabels);
        setIndex(0); // reset to first item after load
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
    length,
    labels,
    months,
    years,
    value: labels[index],
  };
}
