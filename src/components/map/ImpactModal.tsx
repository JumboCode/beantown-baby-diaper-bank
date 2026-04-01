"use client";
import { Text, Button, Group, Stack, Divider, Popover } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconDiaper, IconHeartHandshake } from "@tabler/icons-react";

const tiers = [
  { amount: "$10", diapers: 1, label: "~1 week", sublabel: "of diapers for 1 baby" },
  { amount: "$25", diapers: 2, label: "~2 weeks", sublabel: "of diapers for 1 baby" },
  { amount: "$50", diapers: 4, label: "~1 month", sublabel: "of diapers for 1 baby" },
];

export default function ImpactModal() {
  const [opened, { toggle, close }] = useDisclosure(false);

  return (
    <>
      {opened && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 299 }}
          onClick={close}
        />
      )}
      <Popover
        opened={opened}
        onClose={close}
        position="bottom-end"
        withArrow
        shadow="lg"
        width="clamp(260px, 90vw, 340px)"
        radius="md"
      >
        <Popover.Target>
          <Button
            onClick={toggle}
            leftSection={<IconHeartHandshake size={18} />}
            styles={{
              root: {
                backgroundColor: "#1e3a5f",
                color: "white",
                fontWeight: 600,
                borderRadius: "8px",
                fontSize: "14px",
                "&:hover": { backgroundColor: "#163050" },
              },
            }}
          >
            Make an Impact
          </Button>
        </Popover.Target>

        <Popover.Dropdown p="lg">
          <Text fw={800} mb={6} style={{ fontSize: "17px", color: "#1e3a5f", lineHeight: 1.3 }}>
            Help us bring diaper relief to the greater Boston area!        </Text>
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
                  <Text fw={700} c="#1e3a5f" style={{ fontSize: "13px", lineHeight: 1.2, whiteSpace: "nowrap" }}>
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
    </>
  );
}
