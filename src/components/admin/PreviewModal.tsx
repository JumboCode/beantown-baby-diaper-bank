import { useState } from 'react';
import { MonthPickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, Text, Radio, RadioGroup, Group } from '@mantine/core';
// import { modals } from '@mantine/core';
// import { ModalsProvider } from '@mantine/modals';

export default function PreviewModal() {
  const [opened, { open, close }] = useDisclosure(false);
  // const [numMonths, setNumMonths] = useState('one_month');
  // const [monthsRange, setMonthsRange] = useState<[string | null, string | null]>([null, null]);
  // const [oneMonth, setOneMonth] = useState<string | null>(null);

  return (
    <>
      <Modal size="lg" opened={opened} onClose={close}  
        title={<Text fw="bold" fz={28}> Title </Text>} 
        withCloseButton={false} centered>
          
        

        <Button> Delete </Button>
      </Modal>
    </>
  );
}