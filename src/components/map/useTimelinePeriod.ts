import { useCallback, useEffect, useState } from "react";

export function useTimelinePeriod() {
  const [index, setIndex] = useState(0);
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/timeline-slider")
      .then((r) => r.json())
      .then((data: { years: number[] }) => {
        const yearLabels = (data.years ?? []).map(String);
        setLabels(yearLabels);
        const defaultIndex = yearLabels.indexOf("2026");
        setIndex(defaultIndex !== -1 ? defaultIndex : yearLabels.length - 1);
      })
      .catch((err) => console.error("timeline fetch failed", err));
  }, []);

  const move = useCallback(
    (dir: number) => {
      if (dir === 0) return;
      setIndex((prev) => {
        const max = Math.max(0, labels.length - 1);
        return Math.min(Math.max(prev + dir, 0), max);
      });
    },
    [labels.length],
  );

  return { index, setIndex, move, labels };
}
