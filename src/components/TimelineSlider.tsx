import { Slider } from "@mantine/core";

export interface TimelineSliderProps {
  labels: (string | number)[];
  value: number;
  setValue: (value: number) => void;
}

export default function TimelineSlider({
  labels,
  value,
  setValue,
}: TimelineSliderProps) {
  return (
    <div>
      <div>{labels[value]}</div>
      <Slider
        restrictToMarks
        min={0}
        max={Math.max(0, labels.length - 1)}
        value={value}
        onChange={setValue}
        step={1}
        marks={labels.map((label, idx) => ({
          value: idx,
          label: typeof label === "number" ? label.toString() : label,
        }))}
        styles={{
          markLabel: { fontSize: 12 },
        }}
      />
    </div>
  );
}
