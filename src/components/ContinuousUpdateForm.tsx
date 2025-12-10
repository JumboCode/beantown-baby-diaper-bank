import { useState } from "react";
import { Paper, Stack, Group, Text, RadioGroup, Radio } from "@mantine/core";
import { RiLineChartLine } from "react-icons/ri";
import { Month, MonthPickerInput } from "@mantine/dates";
import CityPercentagesForm, { CityPercentage } from "./CityPercentagesForm";

type Month = string; // e.g., "2024-06"

type ContinuousUpdateFormProps = {
  initialCityPercentages?: CityPercentage[];
};

export default function ContinuousUpdateForm({
  initialCityPercentages,
}: ContinuousUpdateFormProps) {
  const [monthRange, setMonthRange] = useState<[Month | null, Month | null]>([
    null,
    null,
  ]);
  const [fromMonth, setFromMonth] = useState<Month | null>(null);

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
            Effective From
          </Text>
          <RadioGroup>
            <Stack gap="lg">
              <Radio
                value="now"
                label="Now (apply to all future distributions)"
                onChange={() => {
                  setMonthRange([null, null]);
                  setFromMonth(null);
                }}
              />
              <Group>
                <Radio
                  value="range"
                  label="Range of months"
                  onChange={() => {
                    setFromMonth(null);
                    setMonthRange([null, null]);
                  }}
                />
                <MonthPickerInput
                  placeholder="Select a range of months"
                  value={monthRange}
                  onChange={setMonthRange}
                  type="range"
                />
              </Group>
              <Group>
                <Radio
                  value="from"
                  label="From specific month onward"
                  onChange={() => {
                    setMonthRange([null, null]);
                    setFromMonth(null);
                  }}
                />
                <MonthPickerInput
                  value={fromMonth}
                  onChange={setFromMonth}
                  w={200}
                  placeholder="Select a month"
                />
              </Group>
            </Stack>
          </RadioGroup>
        </Stack>
        <CityPercentagesForm initialEntries={initialCityPercentages} />
      </Stack>
    </Paper>
  );
}
