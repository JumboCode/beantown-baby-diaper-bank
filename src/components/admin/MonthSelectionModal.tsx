import { useState } from 'react';
import { MonthPickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, Text, Radio, RadioGroup, Group } from '@mantine/core';
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

      const monthName = MONTH_NAMES[start.month + 1];
      console.log(monthName);

      const preview = await fetch(`http://localhost:3000/api/distributions?month=${monthName}&year=${start.year}`);
      if (!preview.ok) {
        console.error("Error: could not fetch distributions for", monthName);
      } else {
        const preview_json = await preview.json()
        setPreviewData(preview_json);
        console.log(preview_json);
      }
    } else { // i think we can just make this else but idk  
      console.log("in fetch: range");
      let currMonth = start.month;
      let currYear = start.year;

      if (end === null) return;
      const allResults = [];

      // need to have the months increment even if at the end of the year
      // year takes on 2 states, at the end, or less than the end?
      while ((currMonth <= end.month) && (currYear < end.year || currYear == end.year)) {
        const monthName = MONTH_NAMES[end.month + 1];
        const curr_preview = await fetch(`http://localhost:3000/api/distributions?month=${monthName}&year=${currYear}`)
        if (!curr_preview.ok) {
          console.error("Error: could not fetch distributions for", monthName);
        } else {
          const json = await curr_preview.json();
          allResults.push(...json); // ... spreads out the json items
        }

        currMonth++;
        if (currMonth > 12) {
          currMonth = 1;
          currYear++;
        }
      }
      
      setPreviewData(allResults);
    }

    console.log(previewData);
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
        {isPreviewMode && 
        (<>
          <Text fw={600} fz={22} mb="sm">
            Preview Records to Delete
          </Text>

          {previewData.length === 0 ? (<Text>No records match your selection</Text>) : (
            previewData.map((item) => (
                <Text key={item.id} c="dimmed">
                  {JSON.stringify(item)}
                </Text>
              ))
          )}
        </>)}
        <Button onClick={handleClick}>Apply Selection</Button>
      </Modal>
      <Button variant="default" radius={5} onClick={open}>
        Delete
      </Button>
    </>
  );
}