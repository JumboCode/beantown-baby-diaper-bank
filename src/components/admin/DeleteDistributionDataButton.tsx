import { useState, useEffect } from "react";
import { DateValue, MonthPickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import {
  Modal,
  Button,
  Text,
  Radio,
  Group,
  Table,
  Stack,
  Loader,
  Center,
  Title,
} from "@mantine/core";
import { ConfirmDeletion } from "./ConfirmDeleteDistModal";
import { Distribution } from "@/lib/types";

export interface MonthSelectionData {
  mode: "one_month" | "range";
  start: { month: number; year: number };
  end: { month: number; year: number } | null;
}

interface MonthSelectionModalProps {
  onSuccess?: () => void;
}

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

interface TimelineSliderMonth {
  Month: string | null;
  Year: string | null;
}

// export default function MonthSelectionModal({opened, onClose, onSubmit} : MonthSelectionModalProps) {
export default function DeleteDistributionDataButton({
  onSuccess,
}: MonthSelectionModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [numMonths, setNumMonths] = useState<string | null>("one_month");
  const [monthsRange, setMonthsRange] = useState<
    [DateValue | null, DateValue | null]
  >([null, null]);
  const [loadingDistributions, setLoadingDistributions] = useState(false);
  const [oneMonth, setOneMonth] = useState<Date | null>(null);
  const [previewData, setPreviewData] = useState<Distribution[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<
    { month: string; year: number }[]
  >([]);

  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const response = await fetch("/api/timeline-slider");
        if (response.ok) {
          const data = await response.json();
          const months = (Array.isArray(data.months) ? data.months : [])
            .filter(
              (m: TimelineSliderMonth) =>
                typeof m.Month === "string" && typeof m.Year === "string",
            )
            .map((m: TimelineSliderMonth) => ({
              month: m.Month!.toLowerCase(),
              year: Number(m.Year),
            }))
            .filter((m: { month: string; year: number }) => !Number.isNaN(m.year));
          setAvailableMonths(months);
        }
      } catch (error) {
        console.error("Error fetching available months:", error);
      }
    };
    fetchAvailableMonths();
  }, []);

  async function fetchPreviewMonthSelection(selection: MonthSelectionData) {
    setLoadingDistributions(true);
    const { mode, start, end } = selection;
    let url = "";

    if (mode === "one_month") {
      const monthName = MONTH_NAMES[start.month];
      url = `/api/distributions?month=${monthName}&year=${start.year}`;
    } else {
      if (end === null) return;
      const startMonthName = MONTH_NAMES[start.month];
      const endMonthName = MONTH_NAMES[end.month];
      url = `/api/distributions?startMonth=${startMonthName}&startYear=${start.year}&endMonth=${endMonthName}&endYear=${end.year}`;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error("Error fetching preview data");
        setPreviewData([]);
      } else {
        const data = await response.json();
        setPreviewData(data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setPreviewData([]);
    } finally {
      setLoadingDistributions(false);
    }
  }

  async function deletePreviewedDistributions() {
    const ids = previewData.map((d) => d.id);
    if (ids.length === 0) return;

    const res = await fetch(`/api/distributions`, {
      method: "DELETE", // Changed from POST to DELETE
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Delete failed:", err);
      return;
    }

    const data = await res.json();
    console.log("Deleted:", data.deletedCount);

    setPreviewData([]);
    setIsPreviewMode(false);
    onSuccess?.(); // Trigger refresh on success
    close();
  }

  const handleClick = () => {
    setPreviewData([]);
    setIsPreviewMode(true);
    console.log(numMonths);

    if (numMonths === "one_month") {
      if (!oneMonth) {
        return;
      }
      fetchPreviewMonthSelection({
        mode: "one_month",
        start: {
          month: new Date(oneMonth).getUTCMonth(),
          year: new Date(oneMonth).getUTCFullYear(),
        },
        end: null,
      });
    } else {
      if (!monthsRange) {
        return;
      }
      const [start, end] = monthsRange;
      console.log(start, end);

      if (!start || !end) return;

      // if (start instanceof Date && end instanceof Date) {
      console.log("Fetching preview data for range");
      fetchPreviewMonthSelection({
        mode: "range",
        start: {
          month: new Date(start).getUTCMonth(),
          year: new Date(start).getUTCFullYear(),
        },
        end: {
          month: new Date(end).getUTCMonth(),
          year: new Date(end).getUTCFullYear(),
        },
      });
    }
    // }
  };

  function handleRadioChange(value: string): void {
    setNumMonths(value);
    setPreviewData([]);
    setIsPreviewMode(false);
  }

  return (
    <>
      <Modal
        size="lg"
        opened={opened}
        onClose={close}
        title={
          <Text fw={700} size="xl">
            Delete Records
          </Text>
        }
        withCloseButton={true}
        centered
      >
        <Stack gap="sm">
          <Text c="dimmed" size="sm">
            Select a date range to preview and delete records.
          </Text>

          <Radio.Group
            value={numMonths}
            onChange={handleRadioChange}
            required
            label="Selection Mode"
            styles={{
              label: {
                fontWeight: 700,
                fontSize: "1rem",
                marginBottom: "4px",
              },
            }}
          >
            <Group mt="xs">
              <Radio color="#163663" value="one_month" label="One Month" />
              <Radio color="#163663" value="range" label="Range of Months" />
            </Group>
          </Radio.Group>

          <Group grow mt="md" gap="md" align="flex-end">
            {numMonths === "one_month" ? (
              <MonthPickerInput
                label="Select Date"
                placeholder="Date"
                value={oneMonth}
                onChange={(date) => setOneMonth(date as Date | null)}
                getMonthControlProps={(date) => {
                  const d = new Date(date);
                  const monthName = MONTH_NAMES[d.getUTCMonth()].toLowerCase();
                  const year = d.getUTCFullYear();
                  const isAvailable = availableMonths.some(
                    (m) => m.month === monthName && m.year === year,
                  );
                  return { disabled: !isAvailable };
                }}
                styles={{
                  label: {
                    fontWeight: 700,
                    fontSize: "1rem",
                  },
                }}
              />
            ) : (
              <MonthPickerInput
                type="range"
                label="Select Date Range"
                placeholder="Date Range"
                value={monthsRange}
                onChange={setMonthsRange}
                getMonthControlProps={(date) => {
                  const d = new Date(date);
                  const monthName = MONTH_NAMES[d.getUTCMonth()].toLowerCase();
                  const year = d.getUTCFullYear();
                  const isAvailable = availableMonths.some(
                    (m) => m.month === monthName && m.year === year,
                  );
                  return { disabled: !isAvailable };
                }}
                styles={{
                  label: {
                    fontWeight: 700,
                    fontSize: "1rem",
                  },
                }}
              />
            )}

            <Button onClick={handleClick} color="#163663" mt="md">
              Apply Selection
            </Button>
          </Group>
          <Title order={5} mt="md">
            Preview Distributions to Delete
          </Title>

          {isPreviewMode ? (
            <Stack gap="xs" mt="md">
              {loadingDistributions ? (
                <Center>
                  <Loader type="bars" />
                </Center>
              ) : (
                <>
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    <Table
                      withTableBorder
                      highlightOnHover
                      stickyHeader
                      striped
                    >
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Partner</Table.Th>
                          <Table.Th>City</Table.Th>
                          <Table.Th># Diapers</Table.Th>
                          <Table.Th># Children</Table.Th>
                          <Table.Th>Month</Table.Th>
                          <Table.Th>Year</Table.Th>
                        </Table.Tr>
                      </Table.Thead>

                      <Table.Tbody>
                        {previewData.map((dist) => (
                          <Table.Tr
                            key={`${dist.id}-${dist.month}-${dist.year}-${dist.createdAt}`}
                          >
                            <Table.Td>{dist.partner?.name}</Table.Td>
                            <Table.Td>{dist.city?.name}</Table.Td>
                            <Table.Td>{dist.numberDiapers}</Table.Td>
                            <Table.Td>{dist.numberChildren}</Table.Td>
                            <Table.Td>{dist.month}</Table.Td>
                            <Table.Td>{dist.year}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </div>
                  <ConfirmDeletion
                    count={previewData.length}
                    onConfirm={deletePreviewedDistributions}
                  />
                </>
              )}
            </Stack>
          ) : (
            <Text c="dimmed" size="sm">
              Select a date range to preview and delete records.
            </Text>
          )}
        </Stack>
      </Modal>
      <Button variant="default" radius={5} onClick={open}>
        Delete
      </Button>
    </>
  );
}
