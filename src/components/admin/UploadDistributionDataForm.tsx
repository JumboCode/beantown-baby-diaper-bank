import { Modal, Button, Group, Text, Stack, Alert } from "@mantine/core";
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
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleClose = () => {
    setWarnings([]);
    onClose();
  };


  const handleUpload = async () => {
    setWarnings([]);

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

      const result = (await response.json()) as {
        data?: unknown;
        error?: string;
        errors?: string[];
      };

      if (!response.ok) {
        const nextWarnings =
          result.errors && result.errors.length > 0
            ? result.errors
            : [result.error ?? "Upload failed."];
        setWarnings(nextWarnings);
        return;
      }

      console.log("Upload processed:", result.data);
      onUploaded?.();
      handleClose();
    } catch (error) {
      console.error("Failed to upload distribution data:", error);
      setWarnings(["Upload failed. Please try again."]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        size="lg"
        title={
          <Text fw={700} size="xl">
            Upload New Dataset
          </Text>
        }
      >
        <Stack gap="sm">
          {warnings.length > 0 ? (
            <Alert color="red" title="Please fix the following:">
              <Stack gap={4}>
                {warnings.map((warning) => (
                  <Text key={warning} size="sm">
                    {warning}
                  </Text>
                ))}
              </Stack>
            </Alert>
          ) : null}

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
            <Button variant="default" color="#163663" onClick={handleClose}>
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
