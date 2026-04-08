import { Paper, Stack, Group, Text } from "@mantine/core";
import { RiLineChartLine } from "react-icons/ri";
import CityPercentagesForm, { CityPercentage } from "./CityPercentagesForm";

type ContinuousUpdateFormProps = {
  partnerId: string;
  initialCityPercentages?: CityPercentage[];
};

export default function ContinuousUpdateForm({
  partnerId,
  initialCityPercentages,
}: ContinuousUpdateFormProps) {
  const handleSaveContinuous = async (entries: CityPercentage[]) => {
    try {
      const response = await fetch("/api/partners/percentages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId,
          percentages: entries.map((e) => ({
            city: e.city,
            percentage: e.percent / 100,
          })),
        }),
      });
      if (response.ok) alert("Global percentages updated!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="md">
        <Group gap="xs">
          <RiLineChartLine size={20} color="#0B3A79" />
          <Text fw={700} size="lg" c="#0B3A79">
            Continuous Update
          </Text>
        </Group>
        <Text size="sm" c="dimmed">
          This will update distributions for a continuous range of months
        </Text>
        <Stack gap={6}>
          <Text fw={600} size="sm">
            Effective From now (applies to all future distributions)
          </Text>
        </Stack>
        <CityPercentagesForm
          initialEntries={initialCityPercentages}
          onSave={handleSaveContinuous}
        />
      </Stack>
    </Paper>
  );
}
