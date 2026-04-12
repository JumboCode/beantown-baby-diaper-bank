import { useEffect, useMemo, useState } from "react";
import {
  Stack,
  Group,
  Text,
  ComboboxItem,
  TagsInput,
  Table,
  NumberInput,
  Button,
  Divider,
} from "@mantine/core";
import { RiCheckLine } from "react-icons/ri";

export type CityPercentage = {
  id: string;
  city: string;
  percent: number;
};

type SaveStatus = "idle" | "loading" | "success" | "error";

interface CityPercentagesFormProps {
  initialEntries?: CityPercentage[];
  disabled?: boolean;
  onSave?: (entries: CityPercentage[]) => void;
  isLoading?: boolean;
  saveStatus?: SaveStatus;
}

const DEFAULT_ENTRIES: CityPercentage[] = [];

export default function CityPercentagesForm({
  initialEntries = DEFAULT_ENTRIES,
  onSave,
  disabled = false,
  isLoading = false,
  saveStatus = "idle",
}: CityPercentagesFormProps) {
  const [citiesAPI, setCitiesAPI] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>(() =>
    initialEntries.map((e) => e.city),
  );
  const [percentages, setPercentages] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialEntries.map((e) => [e.city, e.percent])),
  );

  useEffect(() => {
    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const res = await fetch(
          "https://secure.geonames.org/searchJSON?q=&adminCode1=MA&country=US&featureClass=P&username=jumbocodebbdb",
        );
        const data = await res.json();
        if (data.geonames) {
          const cityNames = data.geonames.map((city: { name: string }) => city.name);
          setCitiesAPI(Array.from(new Set(cityNames)).sort() as string[]);
        }
      } catch {
        // fall back to empty list
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    setSelectedCities(initialEntries.map((e) => e.city));
    setPercentages(Object.fromEntries(initialEntries.map((e) => [e.city, e.percent])));
  }, [initialEntries]);

  const totalPercent = useMemo(
    () => selectedCities.reduce((sum, city) => sum + (percentages[city] ?? 0), 0),
    [selectedCities, percentages],
  );

  const entries: CityPercentage[] = selectedCities.map((city, idx) => ({
    id: `${city}-${idx}`,
    city,
    percent: percentages[city] ?? 0,
  }));

  const handleCitiesChange = (values: string[]) => {
    setSelectedCities(values);
    setPercentages((prev) =>
      values.reduce(
        (acc, city) => {
          acc[city] = prev[city] ?? 0;
          return acc;
        },
        {} as Record<string, number>,
      ),
    );
  };

  const handlePercentChange = (city: string, value: number | string) => {
    let result = 0;
    if (typeof value === "number") {
      result = value;
      const decimalPart = value.toString().split(".")[1];
      if (decimalPart && decimalPart.length > 2) {
        result = Math.round(value * 100) / 100;
      }
    }
    setPercentages((prev) => ({ ...prev, [city]: result }));
  };

  return (
    <Stack gap="sm">
      <Stack gap={6}>
        <Text fw={600} size="sm">
          City Distribution Percentage
        </Text>
        <TagsInput
          placeholder={isLoadingCities ? "Loading cities..." : "Select cities"}
          data={citiesAPI}
          filter={({ options, search }) => {
            const splittedSearch = search.toLowerCase().trim().split(" ");
            return (options as ComboboxItem[]).filter((option) => {
              const words = option.label.toLowerCase().trim().split(" ");
              return splittedSearch.every((searchWord) =>
                words.some((word: string) => word.includes(searchWord)),
              );
            });
          }}
          disabled={disabled || isLoadingCities}
          value={selectedCities}
          onChange={handleCitiesChange}
          radius="md"
        />
      </Stack>

      {selectedCities.length > 0 && (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>City</Table.Th>
              <Table.Th>Percentage</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {selectedCities.map((city) => (
              <Table.Tr key={city}>
                <Table.Td>{city}</Table.Td>
                <Table.Td>
                  <NumberInput
                    placeholder="Enter %"
                    min={0}
                    max={100}
                    suffix="%"
                    value={percentages[city] || ""}
                    onChange={(value) => handlePercentChange(city, value)}
                    disabled={disabled}
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Divider />
      <Group justify="space-between">
        {!disabled && (
          <Text fw={600} c={totalPercent === 100 ? "green" : "red"} size="sm">
            Total: {totalPercent.toFixed(0)}%{totalPercent !== 100 && " (Must equal 100%)"}
          </Text>
        )}

        <Button
          color={saveStatus === "success" ? "green" : saveStatus === "error" ? "red" : "blue"}
          radius="md"
          loading={isLoading}
          disabled={disabled || totalPercent !== 100}
          onClick={() => onSave?.(entries)}
          leftSection={saveStatus === "success" ? <RiCheckLine size={16} /> : undefined}
        >
          {saveStatus === "success"
            ? "Saved!"
            : saveStatus === "error"
              ? "Retry"
              : "Save Percentages"}
        </Button>
      </Group>
    </Stack>
  );
}
