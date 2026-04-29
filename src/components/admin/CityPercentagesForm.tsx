import { useEffect, useMemo, useState } from "react";
import {
  Stack,
  Group,
  Text,
  TagsInput,
  NumberInput,
  ActionIcon,
  Button,
  Divider,
  Modal,
  Mark,
} from "@mantine/core";
import { RiCheckLine, RiCloseLine } from "react-icons/ri";
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
  hidePercentages?: boolean;
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
  hidePercentages = false,
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

  const removeCityFromSelection = (city: string) => {
    setSelectedCities((prev) => prev.filter((c) => c !== city));
    setPercentages((prev) => {
      const next = { ...prev };
      delete next[city];
      return next;
    });
  };

  const addCityToSelection = (city: string) => {
    setSelectedCities((prev) => [...prev, city]);
    setPercentages((prev) => ({ ...prev, [city]: Math.max(0, 100 - totalPercent) }));
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

    // For newly added known cities, default to remaining percentage
    const newTotalBefore = normalized
      .filter((c) => selectedCities.includes(c))
      .reduce((sum, c) => sum + (percentages[c] ?? 0), 0);

    setSelectedCities(normalized);
    setPercentages((prev) => {
      let runningTotal = newTotalBefore;
      return normalized.reduce(
        (acc, city) => {
          if (prev[city] !== undefined) {
            acc[city] = prev[city];
          } else {
            acc[city] = Math.max(0, 100 - runningTotal);
            runningTotal += acc[city];
          }
          return acc;
        },
        {} as Record<string, number>,
      );
    });
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
        title="Add new city"
        styles={{
          title: {
            fontWeight: 700,
            fontSize: 24,
          },
        }}
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            <Mark fw={700}>{pendingCity}</Mark> is not in the system yet. Would you like to add it?
          </Text>
          {addCityError && (
            <Text size="sm" c="red">
              {addCityError}
            </Text>
          )}
          <Group justify="flex-end">
            <Button variant="outline" onClick={handleCancelAddCity} disabled={addCityLoading}>
              Cancel
            </Button>
            <Button loading={addCityLoading} onClick={handleConfirmAddCity}>
              Add City
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Stack gap="sm">
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
          size="md"
        />

        {selectedCities.length > 0 && (
          <Stack gap={6}>
            {selectedCities.map((city) => {
              const pct = percentages[city] ?? 0;
              return (
                <div
                  key={city}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 12px",
                    border: "1px solid var(--mantine-color-gray-3)",
                    borderRadius: "var(--mantine-radius-md)",
                    backgroundColor: "var(--mantine-color-gray-0)",
                  }}
                >
                  <Text fw={600} fz="sm" c="var(--color-text-heading)" style={{ flex: 1 }}>
                    {city}
                  </Text>
                  {!hidePercentages && (
                    <NumberInput
                      placeholder="0"
                      min={0}
                      max={100}
                      suffix="%"
                      size="sm"
                      radius="md"
                      hideControls
                      value={pct}
                      onChange={(value) => handlePercentChange(city, value)}
                      disabled={disabled}
                      style={{ width: 100 }}
                      styles={{
                        input: {
                          fontWeight: 600,
                          textAlign: "right",
                          color:
                            pct === 0 ? "var(--mantine-color-gray-5)" : "var(--color-text-heading)",
                        },
                      }}
                    />
                  )}
                  {!disabled && (
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      radius="xl"
                      onClick={() => removeCityFromSelection(city)}
                      aria-label={`Remove ${city}`}
                    >
                      <RiCloseLine size={14} />
                    </ActionIcon>
                  )}
                </div>
              );
            })}
            {!disabled && !hidePercentages && (
              <Group justify="flex-end" gap={6}>
                <Text
                  fw={700}
                  fz="sm"
                  c={totalPercent === 100 ? "green.7" : totalPercent > 100 ? "red.7" : "dimmed"}
                >
                  Total: {totalPercent.toFixed(0)}%
                </Text>
                {totalPercent !== 100 && (
                  <Text fz="sm" c={totalPercent > 100 ? "red.7" : "dimmed"}>
                    ({totalPercent > 100 ? "over by" : "remaining:"}{" "}
                    {Math.abs(100 - totalPercent).toFixed(0)}%)
                  </Text>
                )}
              </Group>
            )}
          </Stack>
        )}

        {onSave && (
          <>
            <Divider />
            <Group justify="flex-end">
              <Button
                color={saveStatus === "success" ? "green" : saveStatus === "error" ? "red" : "blue"}
                radius="md"
                loading={isLoading}
                disabled={disabled || (!hidePercentages && totalPercent !== 100)}
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
