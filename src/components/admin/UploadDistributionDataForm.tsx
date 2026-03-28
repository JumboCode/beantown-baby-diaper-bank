import {
  Modal,
  Button,
  Group,
  Text,
  Stack,
  SimpleGrid,
  Paper,
  Box,
} from "@mantine/core";
import FileUpload, { FileInfo } from "../sprint2/FileUpload";
import { MonthPickerInput } from "@mantine/dates";
import { useState } from "react";

interface UploadNewDataProps {
  opened: boolean;
  onClose: () => void;
  onUploaded?: () => void;
  uploadedMonths: number[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function UploadNewData({
  opened,
  onClose,
  onUploaded,
  uploadedMonths,
}: UploadNewDataProps) {
  const [datasetMonth, setDatasetMonth] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const currentYear = new Date().getFullYear();
  const uploadedMonthSet = new Set(uploadedMonths);

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
        <Stack gap="md">
          <Paper
            withBorder
            radius="md"
            p="md"
            style={{
              borderColor: "#d9e1ea",
              backgroundColor: "#fafbfc",
            }}
          >
            <Group justify="space-between" align="flex-start" mb="sm" gap="sm">
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text fw={700} size="sm">
                  Uploaded months in {currentYear}
                </Text>
                <Text size="sm" c="dimmed">
                  Use this as a quick reference before uploading a new dataset.
                </Text>
              </div>
              <Group gap="xs" wrap="wrap">
                <Group gap={6}>
                  <Box
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#2f8a22",
                    }}
                  />
                  <Text size="xs" c="dimmed" fw={500}>
                    Uploaded
                  </Text>
                </Group>
                <Group gap={6}>
                  <Box
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#c1c7d0",
                    }}
                  />
                  <Text size="xs" c="dimmed" fw={500}>
                    Missing
                  </Text>
                </Group>
              </Group>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing="sm">
              {MONTHS.map((month, index) => {
                const isUploaded = uploadedMonthSet.has(index);

                return (
                  <Paper
                    key={month}
                    radius="md"
                    p="xs"
                    withBorder
                    style={{
                      minHeight: 72,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      gap: 4,
                      backgroundColor: isUploaded ? "#edf7eb" : "#ffffff",
                      borderColor: isUploaded ? "#8bc17f" : "#d9e1ea",
                    }}
                  >
                    <Text fw={700} size="md" c="#495057">
                      {month}
                    </Text>
                    <Text
                      size="xs"
                      fw={600}
                      c={isUploaded ? "#2f8a22" : "#868e96"}
                      style={{ lineHeight: 1.2 }}
                    >
                      {isUploaded ? "Uploaded" : "Missing"}
                    </Text>
                  </Paper>
                );
              })}
            </SimpleGrid>
          </Paper>

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
