import { Slider, Box } from "@mantine/core";
import Image from "next/image";

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
  const markStep =
    labels.length <= 8 ? 1 : labels.length <= 12 ? 2 : Math.ceil(labels.length / 6);
  const marks = labels.map((label, idx) => {
    const shouldLabel =
      idx === 0 || idx === maxPoints || idx === value || idx % markStep === 0;

    return {
      value: idx,
      label: shouldLabel ? label.toString() : undefined,
    };
  });

  return (
    <Box
      style={{
        position: "relative",
        width: "100%",
        paddingTop: "30px",
        paddingBottom: "12px",
      }}
    >
      <Slider
        min={0}
        max={maxPoints}
        value={value}
        onChange={setValue}
        step={1}
        size={"lg"}
        label={(val) => labels[val]?.toString() || ""}
        labelAlwaysOn
        marks={marks}
        color="#053766"
        thumbSize={36}
        thumbChildren={
          <Image
            src="/bbdb.jpg"
            alt="Timeline marker"
            width={36}
            height={36}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        }
        styles={{
          root: {
            paddingLeft: 6,
            paddingRight: 6,
          },
          track: {
            height: 8,
          },
          bar: {
            background:
              "linear-gradient(90deg, #143E6E 0%, #0F6B99 100%)",
          },
          mark: {
            width: 8,
            height: 8,
            border: "2px solid #FFFFFF",
            backgroundColor: "#D0D5DD",
            top: "50%",
            transform: "translateY(-50%)",
          },
          markLabel: {
            marginTop: 10,
            fontSize: 12,
            fontWeight: 700,
            color: "#667085",
          },
          thumb: {
            borderRadius: "50%",
            overflow: "hidden",
            padding: 0,
            border: "2px solid #FFFFFF",
            boxShadow: "0 4px 12px rgba(5, 55, 102, 0.22)",
          },
          label: {
            backgroundColor: "#FFFFFF",
            border: "1px solid #D0D5DD",
            borderRadius: 999,
            color: "#053766",
            fontWeight: 800,
            padding: "6px 10px",
            boxShadow: "0 6px 18px rgba(16, 24, 40, 0.12)",
          },
        }}
      />
    </Box>
  );
}
