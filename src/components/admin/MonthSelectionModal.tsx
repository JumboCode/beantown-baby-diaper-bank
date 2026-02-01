import { useState } from "react";
import { MonthPickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Button, Text, Radio, Group, Table } from "@mantine/core";
import { ConfirmDeletion } from "./ConfirmDeletionModal";
import { Distribution } from "@/lib/types";

export interface MonthSelectionData {
  mode: "one_month" | "range";
  start: { month: number; year: number };
  end: { month: number; year: number } | null;
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

// export default function MonthSelectionModal({opened, onClose, onSubmit} : MonthSelectionModalProps) {
export default function MonthSelectionModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const [numMonths, setNumMonths] = useState("one_month");
  const [monthsRange, setMonthsRange] = useState<
    [string | null, string | null]
  >([null, null]);
  // const [monthsRange, setMonthsRange] = useState<[Date | null, Date | null]>([null, null]);
  const [oneMonth, setOneMonth] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Distribution[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  async function fetchPreviewMonthSelection(selection: MonthSelectionData) {
    const { mode, start, end } = selection;
    if (mode === "one_month") {
      const monthName = MONTH_NAMES[start.month + 1];
      const preview = await fetch(
        `/api/distributions?month=${monthName}&year=${start.year}`,
      );
      if (!preview.ok) {
        console.error("Error: could not fetch distributions for", monthName);
      } else {
        const preview_json = await preview.json();
        setPreviewData(preview_json);
      }
    } else {
      // i think we can just make this else but idk
      let currMonth = start.month;
      let currYear = start.year;

      if (end === null) return;
      const allResults = [];

      while (
        currYear < end.year ||
        (currYear === end.year && currMonth <= end.month)
      ) {
        const monthName = MONTH_NAMES[currMonth + 1];
        const curr_preview = await fetch(
          `/api/distributions?month=${monthName}&year=${currYear}`,
        );
        if (!curr_preview.ok) {
          console.error("Error: could not fetch distributions for", monthName);
        } else {
          const json = await curr_preview.json();
          allResults.push(...json);
        }

        currMonth++;
        if (currMonth > 11) {
          currMonth = 0;
          currYear++;
        }
      }

      setPreviewData(allResults);
    }
  }

  async function deletePreviewedDistributions() {
    const ids = previewData.map((d) => d.id);
    if (ids.length === 0) return;

    const res = await fetch(`/api/distributions`, {
      method: "POST", // handles bulk-delete
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
    close();
  }

  const handleClick = () => {
    setPreviewData([]);
    setIsPreviewMode(true);

    if (numMonths === "one_month") {
      if (!oneMonth) {
        return;
      }
      const date = new Date(oneMonth);
      fetchPreviewMonthSelection({
        mode: "one_month",
        start: {
          month: date.getMonth(),
          year: date.getFullYear(),
        },
        end: null,
      });
    } else {
      if (!monthsRange) {
        return;
      }
      const [start, end] = monthsRange;

      if (!start || !end) return;
      const start_date = new Date(start);
      const end_date = new Date(end);

      fetchPreviewMonthSelection({
        mode: "range",
        start: {
          month: start_date.getMonth(),
          year: start_date.getFullYear(),
        },
        end: {
          month: end_date.getMonth(),
          year: end_date.getFullYear(),
        },
      });
    }
  };

  return (
    <>
      <Modal
        size="lg"
        opened={opened}
        onClose={close}
        title={
          <Text fw="bold" fz={28}>
            Delete Records
          </Text>
        }
        withCloseButton={true}
        centered
      >
        <Text c="dimmed" style={{ marginBottom: "5px" }}>
          Select a date range to preview and delete records.
        </Text>

        <Radio.Group
          value={numMonths}
          onChange={setNumMonths}
          style={{ marginBottom: "5px" }}
          required
        >
          <Group>
            <Radio color="#053766" value="one_month" label="One Month" />
            <Radio color="#053766" value="range" label="Range of Months" />
          </Group>
        </Radio.Group>

        {numMonths === "one_month" ? (
          <MonthPickerInput
            label="Select Date:"
            placeholder="Date"
            value={oneMonth}
            onChange={setOneMonth}
          />
        ) : (
          <MonthPickerInput
            type="range"
            label="Select Date Range:"
            placeholder="Date Range"
            value={monthsRange}
            onChange={setMonthsRange}
          />
        )}
        <Button
          onClick={handleClick}
          style={{
            marginTop: "5px ",
            width: "100%",
            backgroundColor: "#053766",
          }}
        >
          {" "}
          Apply Selection{" "}
        </Button>
        {isPreviewMode && (
          <>
            <Text fw={600} fz={22} mb="sm" style={{ marginTop: "10px" }}>
              Preview: {previewData.length} records will be deleted
            </Text>

            {previewData.length != 0 && (
              <>
                <Table withTableBorder highlightOnHover mt="md">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Partner</Table.Th>
                      <Table.Th>City</Table.Th>
                      <Table.Th># Diapers distributed</Table.Th>
                      <Table.Th># Children helped</Table.Th>
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
                <ConfirmDeletion
                  count={previewData.length}
                  onConfirm={deletePreviewedDistributions}
                />
              </>
            )}
          </>
        )}
      </Modal>
      <Button variant="default" radius={5} onClick={open}>
        Delete
      </Button>
    </>
  );
}
