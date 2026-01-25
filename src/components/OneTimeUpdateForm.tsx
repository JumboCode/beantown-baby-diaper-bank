import { useState } from "react";
import { Paper, Stack, Group, Text } from "@mantine/core";
import { RiCalendarEventLine } from "react-icons/ri";
import { MonthPickerInput } from "@mantine/dates";
import CityPercentagesForm, { CityPercentage } from "./CityPercentagesForm";

type OneTimeUpdateFormProps = {
  initialCityPercentages?: CityPercentage[];
};

export default function OneTimeUpdateForm({
  initialCityPercentages,
}: OneTimeUpdateFormProps) {
  const [month, setMonth] = useState<string | null>(null);

  return (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap="md">
        <Group gap="xs">
          <RiCalendarEventLine size={20} color="#0B3A79" />
          <Text fw={700} size="lg" c="#0B3A79">
            One-Time Update
          </Text>
        </Group>
        <Text size="sm" c="dimmed">
          This will only update distributions for the selected month. It will
          not affect the partner&apos;s ongoing percentages or other months.
        </Text>

        <Stack gap={6}>
          <Text fw={600} size="sm">
            Select Month
          </Text>
          <MonthPickerInput
            placeholder="Choose a month"
            value={month}
            onChange={setMonth}
            radius="md"
            size="md"
          />
        </Stack>

        <CityPercentagesForm initialEntries={initialCityPercentages} />
      </Stack>
    </Paper>
  );
}
