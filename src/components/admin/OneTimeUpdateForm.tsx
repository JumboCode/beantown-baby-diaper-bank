import { useState, useEffect } from "react";
import { Paper, Stack, Group, Text } from "@mantine/core";
import { RiCalendarEventLine } from "react-icons/ri";
import { MonthPickerInput } from "@mantine/dates";
import CityPercentagesForm, { CityPercentage } from "./CityPercentagesForm";

type OneTimeUpdateFormProps = {
  partnerId: string;
  initialCityPercentages?: CityPercentage[];
  dataNotExistErrorMsg?: string | null;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function OneTimeUpdateForm({
  partnerId,
  initialCityPercentages,
  dataNotExistErrorMsg,
}: OneTimeUpdateFormProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [exists, setExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [canSave, setCanSave] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const checkDistributions = async () => {
    if (!selectedDate) {
      setExists(null);
      setCanSave(false);
      return;
    }
    setLoading(true);

    const monthName = MONTH_NAMES[Number(selectedDate.split("-")[1]) - 1];
    const year = Number(selectedDate.split("-")[0]);

    try {
      const res = await fetch(`/api/distributions?month=${monthName}&year=${year}`);
      const data = await res.json();

      // Filter to see if this specific partner has a record in that month's distribution
      const partnerData = data.filter((d: any) => String(d.partnerId) === String(partnerId));
      const doesExist = partnerData.length > 0;

      setExists(doesExist);
      setCanSave(doesExist);
    } catch (err) {
      console.error("Error verifying month:", err);
      setExists(false);
      setCanSave(false);
    } finally {
      setLoading(false);
    }
  };

  // Once a new (year, month) combo is selected, check if there's existing data
  useEffect(() => {
    checkDistributions();
  }, [selectedDate, partnerId]);

  // Handler to save the specific monthly distribution
  const handleSaveOneTime = async (entries: CityPercentage[]) => {
    if (!selectedDate) return;
    if (!canSave) {
      alert(
        "Cannot save: No existing distribution data for this month. Please verify the month or contact support.",
      );
      return;
    }

    setIsSaving(true);
    const monthName = MONTH_NAMES[Number(selectedDate.split("-")[1]) - 1];
    const year = Number(selectedDate.split("-")[0]);

    console.log({
      partnerId,
      month: monthName,
      year: year,
      percentages: entries.map((e) => ({
        city: e.city.trim(),
        percentage: e.percent / 100,
      })),
    });

    try {
      const response = await fetch("/api/distributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId,
          month: monthName,
          year: year,
          percentages: entries.map((e) => ({
            city: e.city.trim(),
            percentage: e.percent / 100,
          })),
        }),
      });

      if (response.ok) {
        alert(`Successfully updated distributions for ${monthName} ${year}`);
      } else {
        const errData = await response.json();
        alert(`Error: ${errData.error || "Failed to update"}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("A network error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Paper withBorder radius="lg" p="lg" className="bg-gray-50/50">
      <Stack gap="md">
        <Group gap="xs">
          <RiCalendarEventLine size={20} color="#0B3A79" />
          <Text fw={700} size="lg" c="#0B3A79">
            One-Time Update
          </Text>
        </Group>

        <Text size="sm" c="dimmed">
          This will only update distributions for the selected historical month. It will not affect
          the partner&apos;s ongoing/default percentages.
        </Text>

        <Stack gap={6}>
          <Text fw={600} size="sm">
            Select Month
          </Text>
          <MonthPickerInput
            placeholder="Choose a month"
            value={selectedDate}
            onChange={setSelectedDate}
            radius="md"
            size="md"
            dropdownType="popover"
          />
          {exists === false && !loading && (
            <Text c="red" size="sm" fw={500}>
              {dataNotExistErrorMsg || "No distribution data found for this month."}
            </Text>
          )}
        </Stack>

        <CityPercentagesForm
          initialEntries={initialCityPercentages}
          disabled={!exists || loading}
          onSave={handleSaveOneTime}
          isLoading={isSaving}
        />
      </Stack>
    </Paper>
  );
}
