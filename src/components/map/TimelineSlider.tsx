import { Box, Group, ScrollArea, Text, UnstyledButton } from "@mantine/core";
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
  if (!labels || labels.length === 0) {
    return <Box h={80} />;
  }

  return (
    <ScrollArea type="never" offsetScrollbars scrollbarSize={0}>
      <Box
        style={{
          position: "relative",
          minWidth: "max-content",
          padding: "12px 8px 8px",
        }}
      >
        <Box
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 33,
            left: 44,
            right: 44,
            height: 4,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, rgba(20,62,110,0.18) 0%, rgba(15,107,153,0.18) 100%)",
          }}
        />

        <Group gap="md" wrap="nowrap" align="flex-start">
          {labels.map((label, idx) => {
            const isActive = idx === value;
            const isPast = idx < value;

            return (
              <UnstyledButton
                key={`${label}-${idx}`}
                onClick={() => setValue(idx)}
                aria-pressed={isActive}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 84,
                  gap: 10,
                  cursor: "pointer",
                }}
              >
                <Box
                  style={{
                    width: isActive ? 46 : 18,
                    height: isActive ? 46 : 18,
                    borderRadius: "50%",
                    border: "2px solid #FFFFFF",
                    background: isActive
                      ? "linear-gradient(135deg, #143E6E 0%, #0F6B99 100%)"
                      : isPast
                        ? "#0F6B99"
                        : "#D0D5DD",
                    boxShadow: isActive
                      ? "0 10px 24px rgba(20, 62, 110, 0.22)"
                      : "0 3px 8px rgba(16, 24, 40, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    zIndex: 1,
                    transition:
                      "transform 180ms ease, box-shadow 180ms ease, background 180ms ease",
                    transform: isActive ? "translateY(-2px)" : "none",
                  }}
                >
                  {isActive ? (
                    <Image
                      src="/bbdb.jpg"
                      alt="Selected year"
                      width={42}
                      height={42}
                      style={{ borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : null}
                </Box>

                <Box
                  style={{
                    minWidth: 72,
                    padding: isActive ? "10px 14px" : "8px 12px",
                    borderRadius: 14,
                    border: isActive
                      ? "1px solid rgba(15, 107, 153, 0.24)"
                      : "1px solid transparent",
                    background: isActive
                      ? "linear-gradient(180deg, #F8FBFF 0%, #EEF6FB 100%)"
                      : "transparent",
                    textAlign: "center",
                    transition:
                      "background 180ms ease, border-color 180ms ease, transform 180ms ease",
                    transform: isActive ? "translateY(-2px)" : "none",
                  }}
                >
                  <Text
                    fz={isActive ? 16 : 14}
                    fw={isActive ? 800 : 700}
                    c={isActive ? "#143E6E" : isPast ? "#0F6B99" : "#667085"}
                    lh={1}
                  >
                    {label}
                  </Text>
                </Box>
              </UnstyledButton>
            );
          })}
        </Group>
      </Box>
    </ScrollArea>
  );
}
