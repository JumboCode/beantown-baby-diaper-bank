import { Modal, Button, Group, Text, Stack } from "@mantine/core";
import FileUpload, { FileInfo } from "../sprint2/FileUpload";
import { MonthPickerInput } from "@mantine/dates";
import { useState } from "react";

interface UploadNewDataProps {
  opened: boolean;
  onClose: () => void;
  onUploaded?: () => void;
}

export default function UploadNewData({
  opened,
  onClose,
  onUploaded,
}: UploadNewDataProps) {
  const [datasetMonth, setDatasetMonth] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!fileInfo) {
      console.log("No file uploaded.");
      return;
    }

    if (!datasetMonth) {
      console.log("No month selected.");
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch("/api/distributions/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv: fileInfo.text,
          selectedDate: new Date(datasetMonth).toISOString(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Upload failed.");
      }

      console.log("Upload processed:", result.data);
      onUploaded?.();
      onClose();
    } catch (error) {
      console.error("Failed to upload distribution data:", error);
    } finally {
      setIsUploading(false);
    }
  };

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
            <FileUpload fileInfo={fileInfo} onFileChange={setFileInfo} />
          </Group>

          <Group justify="flex-end" gap="xs">
            <Button variant="default" color="#163663" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="filled"
              color="#163663"
              onClick={handleUpload}
              disabled={!fileInfo || !datasetMonth || isUploading}
              loading={isUploading}
            >
              Upload
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
