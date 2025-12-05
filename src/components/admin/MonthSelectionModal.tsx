import { useState } from 'react';
import { MonthPickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, Text, Radio, RadioGroup, Group } from '@mantine/core';

export default function MonthSelectionModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const [numMonths, setNumMonths] = useState('react');
  const [value, setValue] = useState<[string | null, string | null]>([null, null]);
  
  const handleMonthChange = () => {
    setNumMonths();
  };

  async function handleClick = () => {
    console.log(value)
    const start = value[0]
    const end = value[1]
    console.log(start, end)
    try {
        // for now handles just the range, not the option of a particular month being selected
        const response = await fetch("http://localhost:3000/api/distributions?month=May&year=2025")
    
    } catch {

    }
    
  };

  return (
    <>
      <Modal size="lg" opened={opened} onClose={close}  
        title={<Text fw="bold" fz={28}>Delete Records</Text>} 
        withCloseButton={true} centered>
        {/* <Text size="xl">Delete Records</Text> */}
        <Text c="dimmed">Select a date range to preview and delete records.</Text>

        <RadioGroup
          label="Select your favorite framework/library"
          description="This is anonymous"
          value={monthsRange}
          onChange={setMonthsRange}
          required
        >
          <Radio value="one_month" label="One Month"/>
          <Radio value="range_of_months" label="Range of Months"/>
        </RadioGroup>
        
        
        {/* /* /* <MonthPickerInput
            type="range"
            label="Pick dates range"
            placeholder="Pick dates range"
            value={value}
            onChange={setValue}
        />

        <MonthPickerInput
          dropdownType="modal"
          label="Pick date"
          placeholder="Pick date"
          value={value}
          onChange={setValue}
        /> */ }

        <Button onClick={handleClick}>Apply Range</Button>
      </Modal>

      <Button variant="default" onClick={open}>
        Delete
      </Button>
    </>
  );
}


// export default function MonthSelectionModal() {
//   const [value, setValue] = useState<[string | null, string | null]>([null, null]);
//   return (

//     <MonthPickerInput
//       type="range"
//       label="Pick dates range"
//       placeholder="Pick dates range"
//       value={value}
//       onChange={setValue}
//     />
//   );
// }