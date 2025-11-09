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
import { ActionIcon } from "@mantine/core";

export default function TimelineSliderControls() {
  const [value, setValue] = useState(0);
  const [monthlyOrYearly, setMonthlyOrYearly] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const dataLength =
    monthlyOrYearly === "monthly" ? months.length : years.length;

  // Reset value to 0 when switching between views to avoid out-of-range errors
  const toggleView = () => {
    setMonthlyOrYearly((prev) => (prev === "monthly" ? "yearly" : "monthly"));
    setValue(0);
  };

  // onClick function that adjusts the slider value and prevents overflow
  // 1 for right click, -1 for left click
  const moveSlider = (dir: number) => {
    const max = 10;
    const min = 0;

    if (dir > 0) {
      value == max ? setValue(value) : setValue(value + dir);
    } else {
      value == min ? setValue(value) : setValue(value + dir);
    }
  };

  return (
    <>
      <h1 style={{ color: "#21325b", fontWeight: 700 }}>Timeline Slider</h1>
      <Button
        onClick={toggleView}
        variant="light"
        size="md"
        style={{ margin: "16px 0" }}>
        Switch to {monthlyOrYearly === "monthly" ? "Yearly" : "Monthly"}
      </Button>
      <div className="flex flex-row items-center w-full justify-around">
        <ActionIcon
          color="#053766"
          onClick={() => moveSlider(-1)}>
          <img src="/timelineSlider/left.svg"></img>
        </ActionIcon>
        <div className="flex-1 px-5">
          <TimelineSlider
            monthlyOrYearly={monthlyOrYearly}
            value={value}
            setValue={setValue}
          />
        </div>
        <ActionIcon
          color="#053766"
          onClick={() => moveSlider(1)}>
          <img src="/timelineSlider/right.svg"></img>
        </ActionIcon>
      </div>
    </>
  );
}
