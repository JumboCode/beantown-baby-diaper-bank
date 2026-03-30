import { useMemo, useState } from "react";
import { DateValue, MonthPickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Button, Text, Radio, Group, Table, Stack, Title, Alert, ScrollArea } from "@mantine/core";
import { Distribution } from "@/lib/types";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_ORDER = Object.fromEntries(MONTH_NAMES.map((month, index) => [month, index])) as Record<string, number>;
const MONTH_PICKER_MIN_DATE = new Date(1900, 0, 1);
const MONTH_PICKER_MAX_DATE = new Date(2100, 11, 1);

function toDate(value: DateValue | null): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export default function DeleteDistributionDataButton({ onSuccess }: { onSuccess?: () => void }) {
  const [opened, { open, close }] = useDisclosure(false);
  const [numMonths, setNumMonths] = useState<string | null>("one_month");
  const [monthsRange, setMonthsRange] = useState<[DateValue | null, DateValue | null]>([null, null]);
  const [oneMonth, setOneMonth] = useState<DateValue | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<Distribution[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedPreviewData = useMemo(() => {
    return [...previewData].sort((a, b) => {
      const partnerCompare = (a.partner?.name || "").localeCompare(b.partner?.name || "");
      if (partnerCompare !== 0) return partnerCompare;

      const yearCompare = Number(a.year || 0) - Number(b.year || 0);
      if (yearCompare !== 0) return yearCompare;

      const monthCompare = (MONTH_ORDER[a.month || ""] ?? -1) - (MONTH_ORDER[b.month || ""] ?? -1);
      if (monthCompare !== 0) return monthCompare;

      return (a.city?.name || "").localeCompare(b.city?.name || "");
    });
  }, [previewData]);

  const handlePreviewClick = async () => {
    setLoading(true);
    setError(null);
    setIsPreviewMode(false);

    const selectedMonth = toDate(oneMonth);
    const rangeStart = toDate(monthsRange[0]);
    const rangeEnd = toDate(monthsRange[1]);

    let url = "/api/distributions?";
    if (numMonths === "one_month" && selectedMonth) {
      url += `month=${MONTH_NAMES[selectedMonth.getMonth()]}&year=${selectedMonth.getFullYear()}`;
    } else if (numMonths === "range" && rangeStart && rangeEnd) {
      url += `startMonth=${MONTH_NAMES[rangeStart.getMonth()]}&startYear=${rangeStart.getFullYear()}&endMonth=${MONTH_NAMES[rangeEnd.getMonth()]}&endYear=${rangeEnd.getFullYear()}`;
    } else {
      setError("Please select a date or range first.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      const data = await response.json();
      setPreviewData(Array.isArray(data) ? data : []);
      setIsPreviewMode(true);
    } catch (e: any) {
      setError(e.message || "Network error: Could not connect to the server.");
    } finally {
      setLoading(false); // Ensures spinner stops regardless of outcome
    }
  };

  const handleDeleteRecords = async () => {
    setLoading(true);
    try {
      const idsToDelete = previewData.map(d => d.id);
      const res = await fetch("/api/distributions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsToDelete }),
      });
      if (!res.ok) throw new Error("Deletion failed");
      close();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal opened={opened} onClose={close} title="Delete Records" size="70%" centered>
        <Stack gap="md">
          {error && <Alert color="red" title="Error">{error}</Alert>}
          <Radio.Group label="Selection Mode" value={numMonths} onChange={(v) => { setNumMonths(v); setIsPreviewMode(false); }}>
            <Group mt="xs">
              <Radio value="one_month" label="One Month" color="#053766" />
              <Radio value="range" label="Range of Months" color="#053766" />
            </Group>
          </Radio.Group>

          {numMonths === "one_month" ? (
            <MonthPickerInput label="Select Month" placeholder="Pick a month" value={oneMonth} onChange={(v) => { setOneMonth(v); setIsPreviewMode(false); }} clearable minDate={MONTH_PICKER_MIN_DATE} maxDate={MONTH_PICKER_MAX_DATE} />
          ) : (
            <MonthPickerInput type="range" label="Select Range" placeholder="Pick date range" value={monthsRange} onChange={(v) => { setMonthsRange(v); setIsPreviewMode(false); }} clearable minDate={MONTH_PICKER_MIN_DATE} maxDate={MONTH_PICKER_MAX_DATE} />
          )}

          <Button onClick={handlePreviewClick} loading={loading} fullWidth styles={{ root: { backgroundColor: "#053766", color: "white" } }}>
            Show Preview
          </Button>

          {isPreviewMode && (
            <Stack mt="xl">
              <Title order={4}>Found {previewData.length} records</Title>
              {previewData.length > 0 ? (
                <>
                  <ScrollArea h={300}>
                    <Table striped highlightOnHover withTableBorder>
                      <Table.Thead>
                        <Table.Tr><Table.Th>Partner</Table.Th><Table.Th>Month</Table.Th><Table.Th>Year</Table.Th><Table.Th>City</Table.Th></Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {sortedPreviewData.map((item) => (
                          <Table.Tr key={item.id}>
                            <Table.Td>{item.partner?.name || "N/A"}</Table.Td>
                            <Table.Td>{item.month}</Table.Td>
                            <Table.Td>{item.year}</Table.Td>
                            <Table.Td>{item.city?.name || "N/A"}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                  <Button color="red" variant="filled" fullWidth mt="md" loading={loading} onClick={handleDeleteRecords}>
                    Confirm Deletion of {previewData.length} Records
                  </Button>
                </>
              ) : <Text c="dimmed" ta="center">No records found for the selected period.</Text>}
            </Stack>
          )}
        </Stack>
      </Modal>
      <Button variant="outline" color="red" onClick={open}>Delete Data</Button>
    </>
  );
}
