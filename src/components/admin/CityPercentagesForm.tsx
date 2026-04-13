import { useEffect, useMemo, useState } from "react";
import {
  Stack,
  Group,
  Text,
  TagsInput,
  Table,
  NumberInput,
  Button,
  Divider,
  Modal,
} from "@mantine/core";
import { RiCheckLine } from "react-icons/ri";
import { capitalize } from "lodash";

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
  onChange?: (entries: CityPercentage[]) => void;
  isLoading?: boolean;
  saveStatus?: SaveStatus;
}

const DEFAULT_ENTRIES: CityPercentage[] = [];

export default function CityPercentagesForm({
  initialEntries = DEFAULT_ENTRIES,
  onSave,
  onChange,
  disabled = false,
  isLoading = false,
  saveStatus = "idle",
}: CityPercentagesFormProps) {
  const [citiesFromDB, setCitiesFromDB] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>(() =>
    initialEntries.map((e) => e.city),
  );
  const [percentages, setPercentages] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialEntries.map((e) => [e.city, e.percent])),
  );

  // Modal state for adding an unknown city
  const [pendingCity, setPendingCity] = useState<string | null>(null);
  const [addCityLoading, setAddCityLoading] = useState(false);
  const [addCityError, setAddCityError] = useState<string>("");

  useEffect(() => {
    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const res = await fetch("/api/cities/names");
        const data = await res.json();
        if (Array.isArray(data.data)) {
          setCitiesFromDB(data.data);
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

  useEffect(() => {
    onChange?.(entries);
  }, [selectedCities, percentages]); // onChange intentionally omitted

  const addCityToSelection = (city: string) => {
    setSelectedCities((prev) => [...prev, city]);
    setPercentages((prev) => ({ ...prev, [city]: 0 }));
  };

  const handleCitiesChange = (values: string[]) => {
    const normalized = values.map(capitalize);

    // Detect any newly added value not already selected
    const newValues = normalized.filter((v) => !selectedCities.includes(v));
    const unknownCity = newValues.find((v) => !citiesFromDB.includes(v));

    if (unknownCity) {
      setPendingCity(unknownCity);
      setAddCityError("");
      return;
    }

    setSelectedCities(normalized);
    setPercentages((prev) =>
      normalized.reduce(
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

  const handleConfirmAddCity = async () => {
    if (!pendingCity) return;
    setAddCityLoading(true);
    setAddCityError("");

    try {
      const res = await fetch("/api/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: pendingCity }),
      });

      if (res.status === 201) {
        setCitiesFromDB((prev) => [...prev, pendingCity].sort());
        addCityToSelection(pendingCity);
        setPendingCity(null);
      } else if (res.status === 409) {
        // Already exists — just add to selection
        addCityToSelection(pendingCity);
        setPendingCity(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setAddCityError(data.error || "Failed to add city. Please try again.");
      }
    } catch {
      setAddCityError("A network error occurred. Please try again.");
    } finally {
      setAddCityLoading(false);
    }
  };

  const handleCancelAddCity = () => {
    setPendingCity(null);
    setAddCityError("");
  };

  return (
    <>
      <Modal
        opened={pendingCity !== null}
        onClose={handleCancelAddCity}
        title={<Text fw={700}>Add New City</Text>}
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            <strong>{pendingCity}</strong> is not in the system yet. Would you like to add it?
          </Text>
          {addCityError && (
            <Text size="sm" c="red">
              {addCityError}
            </Text>
          )}
          <Group justify="flex-end">
            <Button
              variant="outline"
              radius="md"
              onClick={handleCancelAddCity}
              disabled={addCityLoading}
            >
              Cancel
            </Button>
            <Button radius="md" loading={addCityLoading} onClick={handleConfirmAddCity}>
              Add City
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Stack gap="sm">
        <Stack gap={6}>
          <Text fw={600} size="sm">
            City Distribution Percentage
          </Text>
          <TagsInput
            placeholder={isLoadingCities ? "Loading cities..." : "Select cities"}
            data={citiesFromDB}
            filter={({ options, search }) => {
              const terms = search.toLowerCase().trim().split(" ");
              return (options as { value: string; label: string }[]).filter((option) => {
                const words = option.label.toLowerCase().trim().split(" ");
                return terms.every((term) => words.some((word) => word.includes(term)));
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

        {!disabled && (
          <Text fw={600} c={totalPercent === 100 ? "green" : "red"} size="sm">
            Total: {totalPercent.toFixed(0)}%{totalPercent !== 100 && " (Must equal 100%)"}
          </Text>
        )}

        {onSave && (
          <>
            <Divider />
            <Group justify="flex-end">
              <Button
                color={saveStatus === "success" ? "green" : saveStatus === "error" ? "red" : "blue"}
                radius="md"
                loading={isLoading}
                disabled={disabled || totalPercent !== 100}
                onClick={() => onSave(entries)}
                leftSection={saveStatus === "success" ? <RiCheckLine size={16} /> : undefined}
              >
                {saveStatus === "success"
                  ? "Saved!"
                  : saveStatus === "error"
                    ? "Retry"
                    : "Save Percentages"}
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </>
  );
}
