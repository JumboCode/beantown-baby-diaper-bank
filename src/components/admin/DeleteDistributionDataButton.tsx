import { useMemo, useState } from "react";
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
  Paper,
  Badge,
  Divider,
} from "@mantine/core";
import { ConfirmDeletion } from "./ConfirmDeleteDistModal";
import { Distribution } from "@/lib/types";

export interface MonthSelectionData {
  mode: "one_month" | "range";
  start: { month: number; year: number };
  end: { month: number; year: number } | null;
}

interface MonthSelectionModalProps {
  onSuccess?: () => void | Promise<void>;
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

const MONTH_ORDER = Object.fromEntries(MONTH_NAMES.map((month, index) => [month, index])) as Record<
  string,
  number
>;

const MONTH_PICKER_MIN_DATE = new Date(1900, 0, 1);
const MONTH_PICKER_MAX_DATE = new Date(2100, 11, 1);

function toDate(value: DateValue | null): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

function formatSelectionLabel(
  mode: string | null,
  oneMonth: DateValue | null,
  monthsRange: [DateValue | null, DateValue | null],
) {
  if (mode === "one_month") {
    const selected = toDate(oneMonth);
    if (!selected) return "No month selected";
    return `${MONTH_NAMES[selected.getUTCMonth()]} ${selected.getUTCFullYear()}`;
  }

  const start = toDate(monthsRange[0]);
  const end = toDate(monthsRange[1]);
  if (!start || !end) return "No range selected";

  return `${MONTH_NAMES[start.getUTCMonth()]} ${start.getUTCFullYear()} to ${MONTH_NAMES[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
}

export default function DeleteDistributionDataButton({ onSuccess }: MonthSelectionModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [numMonths, setNumMonths] = useState<string | null>("one_month");
  const [monthsRange, setMonthsRange] = useState<[DateValue | null, DateValue | null]>([
    null,
    null,
  ]);
  const [loadingDistributions, setLoadingDistributions] = useState(false);
  const [oneMonth, setOneMonth] = useState<DateValue | null>(null);
  const [previewData, setPreviewData] = useState<Distribution[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

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
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Delete failed:", err);
      return;
    }

    await res.json();

    setPreviewData([]);
    setIsPreviewMode(false);
    await onSuccess?.();
    close();
  }

  const handleClick = () => {
    setPreviewData([]);
    setIsPreviewMode(true);

    if (numMonths === "one_month") {
      const selectedMonth = toDate(oneMonth);
      if (!selectedMonth) return;

      fetchPreviewMonthSelection({
        mode: "one_month",
        start: {
          month: selectedMonth.getUTCMonth(),
          year: selectedMonth.getUTCFullYear(),
        },
        end: null,
      });
      return;
    }

    const [start, end] = monthsRange;
    const startDate = toDate(start);
    const endDate = toDate(end);
    if (!startDate || !endDate) return;

    fetchPreviewMonthSelection({
      mode: "range",
      start: {
        month: startDate.getUTCMonth(),
        year: startDate.getUTCFullYear(),
      },
      end: {
        month: endDate.getUTCMonth(),
        year: endDate.getUTCFullYear(),
      },
    });
  };

  function handleRadioChange(value: string): void {
    setNumMonths(value);
    setPreviewData([]);
    setIsPreviewMode(false);
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title="Delete Records"
        withCloseButton
        centered
        size="50%"
      >
        <Stack gap="lg">
          <Stack gap={4}>
            <Text fw={600} size="sm" c="var(--color-text-muted)" tt="uppercase">
              Distribution Cleanup
            </Text>
            <Text c="dimmed" size="sm">
              Preview exactly what will be removed before confirming the deletion.
            </Text>
          </Stack>

          <Paper
            withBorder
            radius="md"
            p="md"
            style={{
              background: "var(--mantine-color-gray-0)",
              borderColor: "var(--mantine-color-gray-3)",
              boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
            }}
          >
            <Stack gap="sm">
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
                  <Radio color="brand" value="one_month" label="One Month" />
                  <Radio color="brand" value="range" label="Range of Months" />
                </Group>
              </Radio.Group>

              <Group grow mt="xs" gap="sm" align="flex-end">
                {numMonths === "one_month" ? (
                  <MonthPickerInput
                    label="Select Date"
                    placeholder="Date"
                    value={oneMonth}
                    onChange={setOneMonth}
                    minDate={MONTH_PICKER_MIN_DATE}
                    maxDate={MONTH_PICKER_MAX_DATE}
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
                    minDate={MONTH_PICKER_MIN_DATE}
                    maxDate={MONTH_PICKER_MAX_DATE}
                    styles={{
                      label: {
                        fontWeight: 700,
                        fontSize: "1rem",
                      },
                    }}
                  />
                )}

                <Button onClick={handleClick} color="brand" mt="md" radius="md">
                  Apply Selection
                </Button>
              </Group>
            </Stack>
          </Paper>

          <Divider color="var(--mantine-color-gray-3)" />

          <Text fw={700} size="lg" c="var(--color-text-heading)">
            Preview Distributions to Delete
          </Text>

          {isPreviewMode ? (
            <Stack gap="sm">
              {loadingDistributions ? (
                <Center py="xl">
                  <Loader type="bars" />
                </Center>
              ) : previewData.length === 0 ? (
                <Paper
                  withBorder
                  radius="md"
                  p="xl"
                  style={{
                    borderColor: "var(--mantine-color-gray-3)",
                    backgroundColor: "var(--mantine-color-gray-0)",
                  }}
                >
                  <Stack gap={4} align="center">
                    <Text fw={700} size="sm" c="var(--color-text-heading)">
                      No records found
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      There are no distribution records for{" "}
                      {formatSelectionLabel(numMonths, oneMonth, monthsRange)}.
                    </Text>
                  </Stack>
                </Paper>
              ) : (
                <>
                  <Paper
                    withBorder
                    radius="md"
                    p="md"
                    style={{
                      borderColor: "var(--mantine-color-gray-3)",
                      backgroundColor: "var(--mantine-color-gray-0)",
                      boxShadow: "0 1px 2px rgba(16, 24, 40, 0.03)",
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <div>
                        <Text fw={700} size="sm" c="var(--color-text-heading)">
                          Pending deletion
                        </Text>
                        <Text size="sm" c="dimmed">
                          {formatSelectionLabel(numMonths, oneMonth, monthsRange)}
                        </Text>
                      </div>
                      <Badge color="gray" variant="filled" size="xl" radius="sm">
                        {previewData.length} record{previewData.length === 1 ? "" : "s"}
                      </Badge>
                    </Group>
                  </Paper>
                  <div
                    style={{
                      maxHeight: "300px",
                      overflowY: "auto",
                      border: "1px solid var(--mantine-color-gray-3)",
                      borderRadius: "12px",
                      backgroundColor: "var(--mantine-color-white)",
                    }}
                  >
                    <Table withTableBorder highlightOnHover stickyHeader striped>
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
                        {sortedPreviewData.map((dist) => (
                          <Table.Tr key={`${dist.id}-${dist.month}-${dist.year}-${dist.createdAt}`}>
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
      <Button variant="default" radius="md" onClick={open}>
        Delete
      </Button>
    </>
  );
}
