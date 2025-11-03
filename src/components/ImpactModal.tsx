import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, NumberInput, Text, Mark } from '@mantine/core';
import { useState } from 'react';

export default function ImpactModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const [value, setValue] = useState<string | number>();

  return (
    <>
      <Modal c="#138D8A" title="Make An Impact!" opened={opened} onClose={close} centered>
        <NumberInput size="lg" label="Donation Amount" placeholder="$ USD" value={value} onChange={setValue} allowNegative={false}/>
        {value !== undefined && value !== null && value !== '' && (
          <Text size="md" style={{
            padding: "3px",
          }}>You can help 
            <Mark p={1} m={4} bd="2px solid #138D8A" c="#138D8A" fw={600} bg="none"> {value && Number(value) * 4} </Mark>
          families!
          </Text>
        )}    
        <Button style={{
          backgroundColor: "#138D8A",
          color: "white",
          fontSize: "12px",
          fontWeight: "bold",
          borderRadius: "10px",
          width: "auto",
          display: "inline-flex",
        }}
        component="a"
        my="md" 
        href="https://beantownbabydiaperbank.org/donate" 
        target="_blank">
          Donate
        </Button>
      </Modal>
      <Button size="auto" variant="default" onClick={open}>
        Open Modal
      </Button>
    </>
  );
}