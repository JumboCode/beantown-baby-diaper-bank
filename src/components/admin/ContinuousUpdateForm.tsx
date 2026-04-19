import { Paper, Stack, Group, Text } from "@mantine/core";
import { RiLineChartLine } from "react-icons/ri";
import CityPercentagesForm, { CityPercentage } from "./CityPercentagesForm";

type ContinuousUpdateFormProps = {
  partnerId: string;
  initialCityPercentages?: CityPercentage[];
  onEntriesChange?: (entries: CityPercentage[]) => void;
};

export default function ContinuousUpdateForm({
  initialCityPercentages,
  onEntriesChange,
}: ContinuousUpdateFormProps) {
  return (
    <Paper withBorder radius="xl" p="lg">
      <Stack gap="md">
        <Group gap="xs">
          <RiLineChartLine size={20} color="var(--color-brand)" />
          <Text fw={700} size="lg" c="brand">
            Continuous Update
          </Text>
        </Group>
        <Text size="sm" c="dimmed">
          This will update distributions for future months based on the percentages you set for each
          city. It will not affect past distributions. Make sure the percentages add up to 100%.
        </Text>
        <CityPercentagesForm initialEntries={initialCityPercentages} onChange={onEntriesChange} />
      </Stack>
    </Paper>
  );
}
