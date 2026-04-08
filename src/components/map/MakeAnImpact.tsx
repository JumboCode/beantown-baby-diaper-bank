"use client";
import { Text, Button, Group, Stack, Divider, Popover, Modal, Box, ThemeIcon } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconDiaper,
  IconHeartHandshake,
  IconArrowRight,
  IconExternalLink,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

const tiers = [
  {
    amount: "$10",
    diapers: 40,
    label: "~1 week",
    sublabel: "of diapers for 1 baby",
    description: "40 diapers",
  },
  {
    amount: "$25",
    diapers: 100,
    label: "~2 weeks",
    sublabel: "of diapers for 1 baby",
    description: "100 diapers",
  },
  {
    amount: "$50",
    diapers: 200,
    label: "~1 month",
    sublabel: "of diapers for 1 baby",
    description: "200 diapers",
  },
];

function TierCard({ tier }: { tier: (typeof tiers)[0] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: hovered
          ? "linear-gradient(135deg, #1B3668 0%, #2471A3 100%)"
          : "linear-gradient(135deg, #edf1f8 0%, #e0e8f5 100%)",
        border: hovered ? "1.5px solid #1B3668" : "1.5px solid #c5d2e9",
        borderRadius: 12,
        padding: "12px 16px",
        cursor: "default",
        transition: "all 0.18s ease",
      }}
    >
      {/* Amount badge */}
      <Box
        style={{
          backgroundColor: hovered ? "rgba(255,255,255,0.15)" : "#1B3668",
          borderRadius: 8,
          padding: "6px 12px",
          minWidth: 58,
          textAlign: "center",
          flexShrink: 0,
          border: hovered ? "1px solid rgba(255,255,255,0.25)" : "none",
        }}
      >
        <Text fw={900} c="white" fz="20px" lh={1}>
          {tier.amount}
        </Text>
      </Box>

      <IconArrowRight
        size={14}
        color={hovered ? "rgba(255,255,255,0.5)" : "#9ab0d6"}
        style={{ flexShrink: 0 }}
      />

      {/* Diaper icons */}
      <Group gap={3} wrap="nowrap" style={{ flexShrink: 0 }}>
        {Array.from({ length: Math.min(tier.diapers / 40, 3) }).map((_, i) => (
          <IconDiaper key={i} size={15} color={hovered ? "rgba(255,255,255,0.8)" : "#2471A3"} />
        ))}
      </Group>

      {/* Label */}
      <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
        <Text fw={800} fz="13px" lh={1.2} c={hovered ? "white" : "#1B3668"}>
          {tier.description}
        </Text>
        <Text fz="11px" fw={500} c={hovered ? "rgba(255,255,255,0.65)" : "#667085"}>
          {tier.label} {tier.sublabel}
        </Text>
      </Stack>
    </Box>
  );
}

function DropdownContent() {
  return (
    <>
      {/* Branded header */}
      <Box
        style={{
          background: "linear-gradient(135deg, #1B3668 0%, #162C58 60%, #2471A3 100%)",
          padding: "20px 20px 16px",
        }}
      >
        <Group gap={10} align="center" mb={8}>
          <ThemeIcon
            size={36}
            radius="xl"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <IconHeartHandshake size={18} color="white" />
          </ThemeIcon>
          <Stack gap={1}>
            <Text fw={900} fz="16px" c="white" lh={1.2}>
              Make an Impact
            </Text>
            <Text fz="11px" c="rgba(255,255,255,0.6)" fw={500}>
              Beantown Baby Diaper Bank
            </Text>
          </Stack>
        </Group>
        <Text fz="13px" c="rgba(255,255,255,0.8)" lh={1.5} fw={400}>
          Every dollar brings diaper relief to families across greater Boston.
        </Text>
      </Box>

      {/* Tier cards */}
      <Box p="md">
        <Text fz="11px" fw={800} c="#667085" tt="uppercase" lts="0.08em" mb={10}>
          See how far your donation goes
        </Text>

        <Stack gap={8} mb="md">
          {tiers.map((tier) => (
            <TierCard key={tier.amount} tier={tier} />
          ))}
        </Stack>

        <Divider color="#E4E7EC" mb="md" />

        <Button
          fullWidth
          component="a"
          href="https://beantownbabydiaperbank.org/donate"
          target="_blank"
          rightSection={<IconExternalLink size={14} />}
          styles={{
            root: {
              backgroundColor: "#F5C200",
              color: "#1B3668",
              fontSize: "14px",
              fontWeight: 900,
              borderRadius: "8px",
              letterSpacing: "0.01em",
              boxShadow: "0 3px 10px rgba(245, 194, 0, 0.35)",
              "&:hover": { backgroundColor: "#DBA900" },
            },
          }}
        >
          Donate Now
        </Button>

        <Text fz="10px" c="#9ca3af" ta="center" mt={8}>
          Secure donation via PayPal
        </Text>
      </Box>
    </>
  );
}

export default function MakeAnImpact() {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const triggerButton = (
    <Button
      leftSection={<IconHeartHandshake size={16} />}
      onClick={isMobile ? () => setMobileOpen(true) : undefined}
      styles={{
        root: {
          color: "#1B3668",
          backgroundColor: "#F5C200",
          border: "none",
          fontWeight: 800,
          borderRadius: "8px",
          fontSize: "14px",
          letterSpacing: "0.01em",
          boxShadow: "0 3px 10px rgba(245, 194, 0, 0.4)",
          "&:hover": { backgroundColor: "#DBA900" },
        },
      }}
    >
      Make an Impact
    </Button>
  );

  return (
    <div ref={ref}>
      {isMobile ? (
        <>
          {triggerButton}
          <Modal
            opened={mobileOpen}
            onClose={() => setMobileOpen(false)}
            withCloseButton={false}
            centered
            padding={0}
            radius="lg"
            size="calc(100vw - 32px)"
            zIndex={10001}
            styles={{
              body: { padding: 0 },
              content: { overflow: "hidden" },
            }}
          >
            <DropdownContent />
          </Modal>
        </>
      ) : (
        <Popover
          position="bottom"
          withArrow
          withOverlay
          shadow="xl"
          radius="lg"
          zIndex={10001}
          width={460}
        >
          <Popover.Target>{triggerButton}</Popover.Target>
          <Popover.Dropdown p={0} style={{ overflow: "hidden" }}>
            <DropdownContent />
          </Popover.Dropdown>
        </Popover>
      )}
    </div>
  );
}
