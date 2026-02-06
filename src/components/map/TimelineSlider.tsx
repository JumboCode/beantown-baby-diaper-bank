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
      {/* This displays the selected month/year at the top-left of the slider */}
      <div style={{ fontWeight: 600, marginBottom: "8px" }}>
        {labels[value]}
      </div>

      <Slider
        restrictToMarks
        min={0}
        max={Math.max(0, labels.length - 1)}
        value={value}
        onChange={setValue}
        step={1}
        // Removed 'label' from the mark objects to stop them from appearing under the slider
        marks={labels.map((_, idx) => ({
          value: idx,
        }))}
        // label={null} removes the floating tooltip (1, 2, 3...) that appears while dragging
        label={null}
        styles={{
          root: { width: "100%" },
          // Ensuring the track looks clean without labels
          mark: { display: "block" },
        }}
      />
    </div>
  );
}
