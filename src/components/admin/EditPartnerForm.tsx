import { useState, useEffect, useMemo } from "react";
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

// Helper for sorting months chronologically
const MONTH_ORDER: Record<string, number> = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

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

  // FIX 2: Sorting logic for the preview table
  const sortedPreviewData = useMemo(() => {
    return [...previewData].sort((a, b) => {
      // 1. Sort by Organization (Partner) Name
      const nameA = a.partner?.name || "";
      const nameB = b.partner?.name || "";
      const nameCompare = nameA.localeCompare(nameB);
      if (nameCompare !== 0) return nameCompare;

      // 2. Sort by Year
      if (a.year !== b.year) {
        return Number(a.year) - Number(b.year);
      }

      // 3. Sort by Month
      return (MONTH_ORDER[a.month] || 0) - (MONTH_ORDER[b.month] || 0);
    });
  }, [previewData]);

  async function fetchPreviewMonthSelection(selection: MonthSelectionData) {
    setLoadingDistributions(true);
    const { mode, start, end } = selection;
    let url = "";

    if (mode === "one_month") {
      const monthName = MONTH_NAMES[start.month];
      url = `/api/distributions/preview-delete?month=${monthName}&year=${start.year}`;
    } else if (mode === "range" && end) {
      const startMonthName = MONTH_NAMES[start.month];
      const endMonthName = MONTH_NAMES[end.month];
      url = `/api/distributions/preview-delete?mode=range&startMonth=${startMonthName}&startYear=${start.year}&endMonth=${endMonthName}&endYear=${end.year}`;
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
        setIsPreviewMode(true);
      }
    } catch (error) {
      console.error("Error fetching preview data:", error);
    } finally {
      setLoadingDistributions(false);
    }
  }

  const deletePreviewedDistributions = async () => {
    try {
      const idsToDelete = previewData.map((d) => d.id);
      const response = await fetch("/api/distributions/delete-records", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsToDelete }),
      });

      if (response.ok) {
        setIsPreviewMode(false);
        setPreviewData([]);
        close();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Deletion failed", error);
    }
  };

  const handlePreviewClick = () => {
    if (numMonths === "one_month" && oneMonth) {
      fetchPreviewMonthSelection({
        mode: "one_month",
        start: { month: oneMonth.getMonth(), year: oneMonth.getFullYear() },
        end: null,
      });
    } else if (numMonths === "range" && monthsRange[0] && monthsRange[1]) {
      fetchPreviewMonthSelection({
        mode: "range",
        start: {
          month: monthsRange[0].getMonth(),
          year: monthsRange[0].getFullYear(),
        },
        end: {
          month: monthsRange[1].getMonth(),
          year: monthsRange[1].getFullYear(),
        },
      });
    }
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={() => {
          setIsPreviewMode(false);
          setPreviewData([]);
          close();
        }}
        title={<Title order={3}>Delete Records</Title>}
        size="70%"
        centered
      >
        <Stack gap="md">
          <Radio.Group
            value={numMonths}
            onChange={(val) => {
              setNumMonths(val);
              setIsPreviewMode(false);
              setPreviewData([]);
            }}
            label="Select deletion type"
          >
            <Group mt="xs">
              <Radio value="one_month" label="One Month" color="#053766" />
              <Radio value="range" label="Range of Months" color="#053766" />
            </Group>
          </Radio.Group>

          {numMonths === "one_month" ? (
            <MonthPickerInput
              label="Select Month"
              placeholder="Pick a month"
              value={oneMonth}
              onChange={(val) => {
                setOneMonth(val);
                setIsPreviewMode(false);
              }}
              clearable
              // FIX 1: shouldDisableDate removed to allow all dates
            />
          ) : (
            <MonthPickerInput
              type="range"
              label="Select Range"
              placeholder="Pick a range"
              value={monthsRange}
              onChange={(val) => {
                setMonthsRange(val);
                setIsPreviewMode(false);
              }}
              clearable
              // FIX 1: shouldDisableDate removed to allow all dates
            />
          )}

          <Button
            onClick={handlePreviewClick}
            disabled={
              numMonths === "one_month"
                ? !oneMonth
                : !monthsRange[0] || !monthsRange[1]
            }
            color="#053766"
          >
            Show Preview
          </Button>

          {loadingDistributions ? (
            <Center py="xl">
              <Loader color="#053766" />
            </Center>
          ) : isPreviewMode ? (
            <Stack>
              <Title order={4}>Preview</Title>
              {previewData.length > 0 ? (
                <>
                  <div
                    style={{
                      maxHeight: "300px",
                      overflowY: "auto",
                      border: "1px solid #eee",
                      borderRadius: "8px",
                    }}
                  >
                    <Table stickyHeader verticalSpacing="sm">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Organization</Table.Th>
                          <Table.Th>City</Table.Th>
                          <Table.Th>Diapers</Table.Th>
                          <Table.Th>Children</Table.Th>
                          <Table.Th>Month</Table.Th>
                          <Table.Th>Year</Table.Th>
                        </Table.Tr>
                      </Table.Thead>

                      <Table.Tbody>
                        {/* FIX 2: Using the sorted data array */}
                        {sortedPreviewData.map((dist) => (
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
              ) : (
                <Text c="dimmed">No records found for this selection.</Text>
              )}
            </Stack>
          ) : (
            <Text c="dimmed" size="sm">
              Select a date range and click "Show Preview" to see records.
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