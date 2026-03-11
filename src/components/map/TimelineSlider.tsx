import { Slider, Box } from "@mantine/core";

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
  // If no labels, just render an empty box to preserve layout
  if (!labels || labels.length === 0) {
    return <Box h={50} />;
  }

  const maxPoints = Math.max(0, labels.length - 1);

  return (
    <Box style={{ position: "relative", width: "100%", paddingBottom: "10px", marginTop: "16px" }}>
      <Slider
        min={0}
        max={maxPoints}
        value={value}
        onChange={setValue}
        step={1}
        size={"lg"}
        label={(val) => labels[val]?.toString() || ""}
        labelAlwaysOn
        marks={labels.map((_, idx) => ({
          value: idx,
        }))}
      />

      <style jsx global>{`
        .mantine-Slider-markFilled {
            border-color: #fff !important;
            background-color: #2C85B2 !important;
        }
      `}</style>
    </Box>
  );
}
