import { useState } from "react";
import { Paper, Stack, Group, Text } from "@mantine/core";
import { RiLineChartLine, RiCheckLine, RiErrorWarningLine } from "react-icons/ri";
import CityPercentagesForm, { CityPercentage } from "./CityPercentagesForm";

type ContinuousUpdateFormProps = {
  partnerId: string;
  initialCityPercentages?: CityPercentage[];
};

type SaveStatus = "idle" | "loading" | "success" | "error";

export default function ContinuousUpdateForm({
  partnerId,
  initialCityPercentages,
}: ContinuousUpdateFormProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleSaveContinuous = async (entries: CityPercentage[]) => {
    setSaveStatus("loading");
    setErrorMsg("");
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
      if (response.ok) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorMsg(data?.error || "Failed to save percentages.");
        setSaveStatus("error");
      }
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
      setSaveStatus("error");
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
          This will update distributions for future months based on the percentages you set for each
          city. It will not affect past distributions. Make sure the percentages add up to 100%.
        </Text>
        <CityPercentagesForm
          initialEntries={initialCityPercentages}
          onSave={handleSaveContinuous}
          isLoading={saveStatus === "loading"}
          saveStatus={saveStatus}
        />
        {saveStatus === "success" && (
          <Group gap="xs">
            <RiCheckLine size={16} color="green" />
            <Text size="sm" c="green" fw={500}>
              Percentages saved successfully.
            </Text>
          </Group>
        )}
        {saveStatus === "error" && (
          <Group gap="xs">
            <RiErrorWarningLine size={16} color="red" />
            <Text size="sm" c="red" fw={500}>
              {errorMsg}
            </Text>
          </Group>
        )}
      </Stack>
    </Paper>
  );
}
