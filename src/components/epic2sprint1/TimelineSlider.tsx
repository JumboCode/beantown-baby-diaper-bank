import { Slider } from "@mantine/core";

export interface TimelineSliderProps {
  monthlyOrYearly: "monthly" | "yearly";
  value: number;
  setValue: (value: number) => void;
}

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

export default function TimelineSlider({
  monthlyOrYearly,
  value,
  setValue,
}: TimelineSliderProps) {
  const data = monthlyOrYearly === "monthly" ? months : years;

  return (
    <div>
      <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 18 }}>
        {data[value]}
      </div>
      <Slider
        restrictToMarks
        min={0}
        max={data.length - 1}
        value={value}
        onChange={setValue}
        step={1}
        marks={data.map((label, idx) => ({
          value: idx,
          label: typeof label === "number" ? label.toString() : "",
        }))}
        styles={{
          markLabel: { fontSize: 12 }
        }}
      />
    </div>
  );
}
