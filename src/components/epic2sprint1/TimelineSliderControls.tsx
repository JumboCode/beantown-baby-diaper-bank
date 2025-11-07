import { useState } from "react";
import TimelineSlider from "./TimelineSlider";
import { Button, Group } from "@mantine/core";

const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const months = [
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

export default function TimelineSliderControls() {
  const [value, setValue] = useState(0);
  const [monthlyOrYearly, setMonthlyOrYearly] = useState<"monthly" | "yearly">("monthly");

  const dataLength = monthlyOrYearly === "monthly" ? months.length : years.length;

  // Reset value to 0 when switching between views to avoid out-of-range errors
  const toggleView = () => {
    setMonthlyOrYearly((prev) => (prev === "monthly" ? "yearly" : "monthly"));
    setValue(0);
  };

  return (
    <div>
      <h1 style={{ color: "#21325b", fontWeight: 700 }}>Timeline Slider</h1>
      <Button onClick={toggleView} variant="light" size="md" style={{ margin: "16px 0" }}>
        Switch to {monthlyOrYearly === "monthly" ? "Yearly" : "Monthly"}
      </Button>
      <Group spacing="sm" mt={6} mb={16}>
      </Group>
      <TimelineSlider monthlyOrYearly={monthlyOrYearly} value={value} setValue={setValue} />
    </div>
  );
}
