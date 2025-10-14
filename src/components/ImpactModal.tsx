import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, NumberInput, Text, NavLink } from '@mantine/core';
import { useState } from 'react';

export default function ImpactModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const [value, setValue] = useState<string | number>();

  return (
    <>
      <Modal c="#138D8A" title="Make An Impact!" opened={opened} onClose={close} centered>
        <NumberInput size="lg" label="Donation Amount" placeholder="$ USD" value={value} onChange={setValue} allowNegative={false}/>        
        <Text size="md" style={{
          padding: "3px",
        }}>You can help 
          <div className="p-2 mx-2 border-1 border-[##D0D5DD] inline-block rounded-md">{value && Number(value) * 4}</div>
        families!</Text>
        <NavLink style={{
            backgroundColor: "#138D8A",
            color: "white",
            fontSize: "12px",
            fontWeight: "bold",
            borderRadius: "10px",
            width: "auto",
            display: "inline-flex",
          }} href="https://beantownbabydiaperbank.org/donate/" label="Donate"/>
      </Modal>

      <Button size="auto" variant="default" onClick={open}>
        Open Modal
      </Button>
    </>
  );
}