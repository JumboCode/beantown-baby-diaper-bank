import { Card, NumberInput, Text, Button } from "@mantine/core";
import { useState } from "react";

export default function ImpactModal() {
  const [value, setValue] = useState<string | number>("");

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text size="xl" fw={600} mb="xs">
        Make an impact
      </Text>

      <Text size="sm" c="dimmed" mb="lg">
        Calculate how you can help!
      </Text>

      <NumberInput
        label="Donation Amount"
        placeholder="USD"
        prefix="$ "
        value={value}
        onChange={setValue}
        allowNegative={false}
        size="md"
        mb="md"
        styles={{
          label: {
            fontSize: "14px",
            fontWeight: 600,
            color: "#000000",
            marginBottom: "8px",
          },
        }}
      />

      {value !== undefined &&
        value !== null &&
        value !== "" &&
        Number(value) > 0 && (
          <Text size="sm" mb="md">
            You could help{" "}
            <Text component="span" fw={700} c="#000000">
              {Number(value) * 4}
            </Text>{" "}
            families!
          </Text>
        )}

      <Button
        fullWidth
        component="a"
        href="https://beantownbabydiaperbank.org/donate"
        target="_blank"
        styles={{
          root: {
            backgroundColor: "#1e3a5f",
            color: "white",
            fontSize: "16px",
            fontWeight: 600,
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: "#163050",
            },
          },
        }}
      >
        Donate
      </Button>
    </Card>
  );
}
