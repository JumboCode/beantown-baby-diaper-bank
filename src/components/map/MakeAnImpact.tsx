"use client";
import { Text, Button, Group, Stack, Divider, Popover } from "@mantine/core";
import { IconDiaper, IconHeartHandshake } from "@tabler/icons-react";
import { useEffect, useRef } from "react";

const tiers = [
  { amount: "$10", diapers: 1, label: "~1 week", sublabel: "of diapers for 1 baby" },
  { amount: "$25", diapers: 2, label: "~2 weeks", sublabel: "of diapers for 1 baby" },
  { amount: "$50", diapers: 4, label: "~1 month", sublabel: "of diapers for 1 baby" },
];

export default function MakeAnImpact() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prevent = (e: WheelEvent | TouchEvent) => e.preventDefault();
    el.addEventListener("wheel", prevent, { passive: false });
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      el.removeEventListener("wheel", prevent);
      el.removeEventListener("touchmove", prevent);
    };
  }, []);

  return (
    <div ref={ref}>
      <Popover position="bottom" withArrow withOverlay shadow="lg" radius="md" zIndex={10001}>
        <Popover.Target>
          <Button
            leftSection={<IconHeartHandshake size={16} color="white" />}
            styles={{
              root: {
                color: "white",
                backgroundColor: "#e3393e",
                border: "none",
                fontWeight: 700,
                borderRadius: "6px",
                fontSize: "14px",
                letterSpacing: "0.02em",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                "&:hover": { backgroundColor: "#c9292e" },
              },
            }}
          >
            Make an Impact
          </Button>
        </Popover.Target>

        <Popover.Dropdown p="lg">
          <Text fw={800} mb={6} style={{ fontSize: "17px", color: "#1e3a5f", lineHeight: 1.3 }}>
            Help us bring diaper relief to the greater Boston area!
          </Text>
          <Text size="sm" c="dimmed" mb="md">
            See how far your donation goes.
          </Text>

          <Divider mb="md" />

          <Stack mb="lg" gap="sm">
            {tiers.map((tier) => (
              <Group
                key={tier.amount}
                align="center"
                gap="sm"
                wrap="nowrap"
                style={{
                  background: "linear-gradient(135deg, #f0f6ff 0%, #e4effe 100%)",
                  border: "1.5px solid #c3d9f7",
                  borderRadius: "12px",
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#1e3a5f",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    minWidth: "52px",
                    flexShrink: 0,
                    textAlign: "center",
                  }}
                >
                  <Text fw={800} c="white" style={{ fontSize: "18px", lineHeight: 1 }}>
                    {tier.amount}
                  </Text>
                </div>

                <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
                  {Array.from({ length: tier.diapers }).map((_, i) => (
                    <IconDiaper key={i} size={16} color="#2c85b2" />
                  ))}
                </Group>

                <div style={{ minWidth: 0 }}>
                  <Text
                    fw={700}
                    c="#1e3a5f"
                    style={{ fontSize: "13px", lineHeight: 1.2, whiteSpace: "nowrap" }}
                  >
                    {tier.label}
                  </Text>
                  <Text size="xs" c="#667085" style={{ whiteSpace: "nowrap" }}>
                    {tier.sublabel}
                  </Text>
                </div>
              </Group>
            ))}
          </Stack>

          <Button
            fullWidth
            component="a"
            href="https://beantownbabydiaperbank.org/donate"
            target="_blank"
            styles={{
              root: {
                backgroundColor: "#1e3a5f",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "8px",
                "&:hover": { backgroundColor: "#163050" },
              },
            }}
          >
            Donate Now
          </Button>
        </Popover.Dropdown>
      </Popover>
    </div>
  );
}
