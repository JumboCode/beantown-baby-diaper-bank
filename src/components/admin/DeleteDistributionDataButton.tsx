import { useState } from "react";
import { DateValue, MonthPickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Button, Text, Radio, Group, Table, Stack, Title, Alert, ScrollArea } from "@mantine/core";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function DeleteDistributionDataButton({ onSuccess }: { onSuccess?: () => void }) {
  const [opened, { open, close }] = useDisclosure(false);
  const [numMonths, setNumMonths] = useState<string | null>("one_month");
  const [monthsRange, setMonthsRange] = useState<[DateValue | null, DateValue | null]>([null, null]);
  const [oneMonth, setOneMonth] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreviewClick = async () => {
    setLoading(true);
    setError(null);
    setIsPreviewMode(false);

    let url = "/api/partners?";
    if (numMonths === "one_month" && oneMonth) {
      url += `month=${MONTH_NAMES[oneMonth.getMonth()]}&year=${oneMonth.getFullYear()}`;
    } else if (numMonths === "range" && monthsRange[0] && monthsRange[1]) {
      url += `mode=range&startYear=${monthsRange[0].getFullYear()}&endYear=${monthsRange[1].getFullYear()}`;
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
      const res = await fetch("/api/partners", {
        method: "DELETE",
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
      <Modal opened={opened} onClose={close} title={<Title order={3}>Delete Records</Title>} size="70%" centered>
        <Stack gap="md">
          {error && <Alert color="red" title="Error">{error}</Alert>}
          <Radio.Group label="Selection Mode" value={numMonths} onChange={(v) => { setNumMonths(v); setIsPreviewMode(false); }}>
            <Group mt="xs">
              <Radio value="one_month" label="One Month" color="#053766" />
              <Radio value="range" label="Range" color="#053766" />
            </Group>
          </Radio.Group>

          {numMonths === "one_month" ? (
            <MonthPickerInput label="Select Month" placeholder="Pick a month" value={oneMonth} onChange={(v) => { setOneMonth(v); setIsPreviewMode(false); }} clearable />
          ) : (
            <MonthPickerInput type="range" label="Select Range" placeholder="Pick date range" value={monthsRange} onChange={(v) => { setMonthsRange(v); setIsPreviewMode(false); }} clearable />
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
                        {previewData.map((item, index) => (
                          <Table.Tr key={index}>
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
              ) : <Text c="dimmed" textAlign="center">No records found for the selected period.</Text>}
            </Stack>
          )}
        </Stack>
      </Modal>
      <Button variant="outline" color="red" onClick={open}>Delete Data</Button>
    </>
  );
}