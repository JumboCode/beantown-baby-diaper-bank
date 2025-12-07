import { useState } from 'react';
import { MonthPickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, Text, Radio, RadioGroup, Group, Table } from '@mantine/core';
// import { modals } from '@mantine/core';
// import { ModalsProvider } from '@mantine/modals';
  // const [previewData, setPreviewData] = useState<any[]>([]);

import PartnerTable from "@/components/admin/PartnerTable"; 

export interface MonthSelectionData {
  mode: "one_month" | "range";
  start: { month: number; year: number };
  end: { month: number; year: number } | null;
}

// interface MonthSelectionModalProps {
//   opened: boolean;
//   onClose: () => void;
//   onSubmit: (data: MonthSelectionData) => void;
// }

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
  const [numMonths, setNumMonths] = useState('one_month');
  const [monthsRange, setMonthsRange] = useState<[string | null, string | null]>([null, null]);
  const [oneMonth, setOneMonth] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  async function fetchPreviewMonthSelection(selection:MonthSelectionData) {
    const { mode, start, end } = selection;
    if (mode === "one_month") {
      console.log("in fetch: one month");
      console.log(start.month);

      const monthName = MONTH_NAMES[start.month];
      console.log("month:", monthName, "year:", start.year);

      const preview = await fetch(`http://localhost:3000/api/distributions?month=${monthName}&year=${start.year}`);
      if (!preview.ok) {
        console.error("Error: could not fetch distributions for", monthName);
      } else {
        const preview_json = await preview.json()
        setPreviewData(preview_json);
        console.log("Preview one_month:",preview_json);
      }
    } else { // i think we can just make this else but idk  
      console.log("in fetch: range");
      let currMonth = start.month;
      let currYear = start.year;

      if (end === null) return;
      const allResults = [];

      // need to have the months increment even if at the end of the year
      // year takes on 2 states, at the end, or less than the end?
      while (currYear < end.year || (currYear === end.year && currMonth <= end.month)) {
        const monthName = MONTH_NAMES[currMonth];
        const curr_preview = await fetch(`http://localhost:3000/api/distributions?month=${monthName}&year=${currYear}`)
        if (!curr_preview.ok) {
          console.error("Error: could not fetch distributions for", monthName);
        } else {
          const json = await curr_preview.json();
          allResults.push(...json); // ... spreads out the json items
        }

        currMonth++;
        if (currMonth > 11) {
          currMonth = 0;
          currYear++;
        }
      }
      
      setPreviewData(allResults);
      console.log("preview_range:", previewData);
    }
  }

  const handleClick = () => {
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
        end: null
      });
    } else {
      if (!monthsRange) {
        return;
      }
      const [start,end] = monthsRange

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
        }
      });
    }
    setPreviewData([]);
    setIsPreviewMode(true);
    // onClose();
  }

  return (
    <>
      <Modal size="lg" opened={opened} onClose={close}   
        title={<Text fw="bold" fz={28}>Delete Records</Text>} 
        withCloseButton={true} centered>
        {/* <Text size="xl">Delete Records</Text> */}
        <Text c="dimmed">Select a date range to preview and delete records.</Text>

        <Radio.Group
          label="Select your favorite framework/library"
          description="This is anonymous"
          value={numMonths}
          onChange={setNumMonths}
          required
        >
          <Radio value="one_month" label="One Month"/>
          <Radio value="range" label="Range of Months"/>
        </Radio.Group>
        
        {numMonths === "one_month"?
          (<MonthPickerInput
          dropdownType="modal"
          label="Pick date"
          placeholder="Pick date"
          value={oneMonth}
          onChange={setOneMonth}
          />) : 
          (<MonthPickerInput
            type="range"
            label="Pick dates range"
            placeholder="Pick dates range"
            value={monthsRange}
            onChange={setMonthsRange}
          />)
        }
        <Button onClick={handleClick}>Apply Selection</Button>
        {isPreviewMode && 
        (<>
          <Text fw={600} fz={22} mb="sm">
            Preview Records to Delete
          </Text>

          <Table withTableBorder highlightOnHover mt="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Partner</Table.Th>
                <Table.Th>Diapers</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Month</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {previewData.map(dist => (
                <Table.Tr key={dist.id}>
                  <Table.Td>{dist.id}</Table.Td>
                  <Table.Td>{dist.partner_id}</Table.Td>
                  <Table.Td>{dist.diapers}</Table.Td>
                  <Table.Td>{new Date(dist.created_at).toLocaleDateString()}</Table.Td>
                  <Table.Td>{dist.month} {dist.year}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </>)}
      </Modal>
      <Button variant="default" radius={5} onClick={open}>
        Delete
      </Button>
    </>
  );
}