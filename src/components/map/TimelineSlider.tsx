import { Slider, Box } from "@mantine/core";
import Image from "next/image";

export interface TimelineSliderProps {
  labels: (string | number)[];
  value: number;
  setValue: (value: number) => void;
  isPlaying?: boolean;
}

export default function TimelineSlider({
  labels,
  value,
  setValue,
  isPlaying = false,
}: TimelineSliderProps) {
  if (!labels || labels.length === 0) {
    return <Box h={40} />;
  }

  const maxPoints = Math.max(0, labels.length - 1);
  const markStep =
    labels.length <= 8 ? 2 : labels.length <= 12 ? 3 : Math.ceil(labels.length / 5);
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
        paddingTop: 14,
        paddingBottom: 2,
      }}
    >
      <Slider
        min={0}
        max={maxPoints}
        value={value}
        onChange={setValue}
        step={1}
        size="lg"
        label={(val) => labels[val]?.toString() || ""}
        marks={marks}
        color="#053766"
        thumbSize={34}
        thumbChildren={
          <Image
            src="/bbdb.jpg"
            alt="Timeline marker"
            width={34}
            height={34}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        }
        styles={{
          root: {
            paddingLeft: 6,
            paddingRight: 6,
          },
          track: {
            height: 5,
            backgroundColor: "#E4E7EC",
          },
          bar: {
            background: "linear-gradient(90deg, #143E6E 0%, #0F6B99 100%)",
            transition: isPlaying
              ? "width 420ms cubic-bezier(0.22, 1, 0.36, 1)"
              : "width 180ms ease-out",
          },
          mark: {
            width: 7,
            height: 7,
            border: "2px solid #FFFFFF",
            backgroundColor: "#D0D5DD",
            top: "50%",
            transform: "translateY(-50%)",
          },
          markLabel: {
            marginTop: 6,
            fontSize: 10,
            fontWeight: 700,
            color: "#667085",
          },
          thumb: {
            borderRadius: "50%",
            overflow: "hidden",
            padding: 0,
            border: "2px solid #FFFFFF",
            boxShadow: "0 4px 12px rgba(5, 55, 102, 0.16)",
            transition: isPlaying
              ? "left 420ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease"
              : "left 180ms ease-out, box-shadow 180ms ease-out",
            transform: isPlaying ? "translate(-50%, -54%) scale(1.02)" : undefined,
          },
          label: {
            backgroundColor: "#FFFFFF",
            border: "1px solid #D0D5DD",
            borderRadius: 999,
            color: "#053766",
            fontWeight: 800,
            padding: "4px 8px",
            boxShadow: "0 4px 12px rgba(16, 24, 40, 0.12)",
            transition: "opacity 180ms ease, transform 180ms ease",
          },
        }}
      />
    </Box>
  );
}
