import { useState, useCallback, useEffect } from "react";
import { Text } from "@mantine/core";

export default function LastUploaded() {
  const [lastUploaded, setLastUploaded] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  const fetchTimelineData = useCallback(async () => {
    try {
      const res = await fetch(`/api/timeline-slider?year=${currentYear}`);
      const data = await res.json();
      if (data.months) {
        const validMonths = data.months.filter(
          (d: { Month: string | null; Year: string | null }) =>
            typeof d.Month === "string" && typeof d.Year === "string",
        );

        if (validMonths.length > 0) {
          const last = validMonths[validMonths.length - 1];
          setLastUploaded(`${last.Month} ${last.Year}`);
        } else {
          setLastUploaded(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch timeline data:", err);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchTimelineData();
  }, [fetchTimelineData]);

  return (
    <>
      {lastUploaded ? (
        <Text fz="13px" c="#667085">
          Last uploaded data: {lastUploaded}
        </Text>
      ) : (
        <Text fz="13px" c="#667085">
          No data uploaded for {currentYear} yet.
        </Text>
      )}
    </>
  );
}
