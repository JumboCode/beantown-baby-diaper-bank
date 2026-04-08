import { useEffect, useMemo, useState } from "react";
import { Stack, Group, Text, Select, NumberInput, Button, Divider } from "@mantine/core";
import { RiCloseLine } from "react-icons/ri";

type CityOption = { value: string; label: string };

export type CityPercentage = {
  id: string;
  city: string;
  percent: number;
};

interface CityPercentagesFormProps {
  cityOptions?: CityOption[];
  initialEntries?: CityPercentage[];
  disabled?: boolean;
  onSave?: (entries: CityPercentage[]) => void;
  isLoading?: boolean;
}

const DEFAULT_CITY_OPTIONS: CityOption[] = [
  { value: "Boston", label: "Boston" },
  { value: "Cambridge", label: "Cambridge" },
  { value: "Medford", label: "Medford" },
  { value: "Somerville", label: "Somerville" },
  { value: "Quincy", label: "Quincy" },
];

const DEFAULT_ENTRIES: CityPercentage[] = [];

export default function CityPercentagesForm({
  cityOptions = DEFAULT_CITY_OPTIONS,
  initialEntries = DEFAULT_ENTRIES,
  onSave,
  disabled = false,
  isLoading = false,
}: CityPercentagesFormProps) {
  const [city, setCity] = useState<string | null>(null);
  const [percentage, setPercentage] = useState<number | undefined>();
  const [entries, setEntries] = useState<CityPercentage[]>(initialEntries);

  useEffect(() => {
    setEntries(initialEntries || []);
  }, [initialEntries]);

  const totalPercent = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.percent, 0),
    [entries],
  );

  const addEntry = () => {
    if (!city || percentage === undefined) return;
    const id = `${city}-${Date.now()}`;
    setEntries((prev) => [...prev, { id, city, percent: percentage }]);
    setCity(null);
    setPercentage(undefined);
  };

  const updatePercent = (id: string, value: number | string) => {
    const percentValue = typeof value === "number" ? value : parseFloat(value);
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? { ...entry, percent: Number.isNaN(percentValue) ? 0 : percentValue }
          : entry,
      ),
    );
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <Stack gap="sm">
      <Stack gap={6}>
        <Text fw={600} size="sm">
          City Distribution Percentage
        </Text>
        <Group gap="sm" wrap="nowrap">
          <Select
            disabled={disabled}
            placeholder="Choose a city"
            data={cityOptions}
            value={city}
            onChange={setCity}
            searchable
            radius="md"
            className="flex-1"
          />
          <NumberInput
            disabled={disabled}
            placeholder="Percentage"
            value={percentage}
            onChange={(val) => setPercentage(typeof val === "number" ? val : undefined)}
            radius="md"
            min={0}
            max={100}
            className="w-[140px]"
          />
          <Button
            disabled={disabled || !city || percentage === undefined}
            radius="md"
            onClick={addEntry}
          >
            Add
          </Button>
        </Group>
      </Stack>

      <Stack gap="sm">
        {entries.map((entry) => (
          <Group
            key={entry.id}
            justify="space-between"
            align="center"
            className="border border-gray-200 rounded-md px-3 py-2"
          >
            <Text fw={600}>{entry.city}</Text>
            <Group gap="xs" align="center">
              <NumberInput
                value={entry.percent}
                onChange={(val) => updatePercent(entry.id, val ?? 0)}
                hideControls
                min={0}
                max={100}
                radius="md"
                className="w-[90px]"
                size="sm"
                styles={{ input: { textAlign: "center" } }}
                disabled={disabled}
              />
              <Text c="dimmed" size="sm">
                %
              </Text>
              <Button
                variant="subtle"
                color="red"
                size="compact-sm"
                disabled={disabled}
                onClick={() => removeEntry(entry.id)}
                leftSection={<RiCloseLine size={16} />}
              >
                Remove
              </Button>
            </Group>
          </Group>
        ))}
      </Stack>

      <Divider />
      <Group justify="space-between">
        {disabled ? null : (
          <Text fw={600} c={totalPercent === 100 ? "green" : "red"} size="sm">
            Total: {totalPercent.toFixed(0)}%{totalPercent !== 100 && " (Must equal 100%)"}
          </Text>
        )}

        <Button
          color="blue"
          radius="md"
          loading={isLoading}
          disabled={disabled || totalPercent !== 100}
          onClick={() => onSave?.(entries)}
        >
          Save Percentages
        </Button>
      </Group>
    </Stack>
  );
}
