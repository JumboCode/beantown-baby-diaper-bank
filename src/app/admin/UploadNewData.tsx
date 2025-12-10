import { Modal, Button, Group, Text, Stack } from "@mantine/core";
import FileUpload from "../../components/sprint2/FileUpload";
import { MonthPickerInput } from "@mantine/dates";
import { useState } from "react";

interface UploadNewDataProps {
  opened: boolean;
  onClose: () => void;
}

export default function UploadNewData({ opened, onClose }: UploadNewDataProps) {
  const [datasetMonth, setDatasetMonth] = useState<string | null>(null);

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        size="lg"
        title={
          <Text fw={700} size="xl">
            Upload New Dataset
          </Text>
        }
      >
        <Stack gap="sm">
          <Group justify="center" grow>
            <MonthPickerInput
              label="Dataset Information"
              placeholder="Select Date"
              description="Choose dataset time"
              value={datasetMonth}
              onChange={setDatasetMonth}
              required
              valueFormat="YYYY MMM"
              styles={{
                label: {
                  fontWeight: 700,
                  fontSize: "1rem",
                },
              }}
            />
          </Group>

          <Group grow>
            <FileUpload />
          </Group>

          <Group justify="flex-end" gap="xs">
            <Button variant="default" color="#163663" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="filled" color="#163663" onClick={onClose}>
              Upload
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
