import { Modal, Button, Group, Text, Stack, Stepper } from "@mantine/core";
import FileUpload, { FileInfo } from "../sprint2/FileUpload";
import { MonthPickerInput } from "@mantine/dates";
import { useState, useEffect } from "react";

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
          <div>
            <Text fw={700} size="sm" mb="xs">
              Uploads in {currentYear}
            </Text>
            <div style={{ display: "flex", justifyContent: "space-evenly" }}>
              {/* Row 1: Jan–Jun */}
              <Stepper
                active={-1}
                allowNextStepsSelect={false}
                size="xl"
                style={{ width: "88%" }}
                styles={{
                  root: { marginBottom: 8 },
                  step: { pointerEvents: "none" },
                  stepIcon: { cursor: "default" },
                  separator: { display: "none" },
                  steps: {justifyContent: "space-between"}
                }}
              >
                {MONTHS.slice(0, 6).map((month, i) => (
                  <Stepper.Step
                    key={month}
                    icon={<span style={{ fontSize: 14 }}>{month}</span>}
                    completedIcon={<span style={{ fontSize: 14 }}>{month}</span>}
                    color={uploadedMonths.includes(i) ? "green" : "gray"}
                    state={uploadedMonths.includes(i) ? "stepCompleted" : "stepInactive"}
                    styles={{
                      stepIcon: {
                        backgroundColor: uploadedMonths.includes(i) ? "green" : undefined,
                        borderColor: uploadedMonths.includes(i) ? "green" : undefined,
                        color: uploadedMonths.includes(i) ? "white" : undefined,
                      }
                    }}
                  />
                ))}
              </Stepper>
            </div>
            <div style={{ display: "flex", justifyContent: "space-evenly" }}>
              {/* Row 2: Jul–Dec */}
              <Stepper
                active={-1}
                allowNextStepsSelect={false}
                size="xl"
                style={{ width: "88%" }}
                styles={{
                  step: { pointerEvents: "none"},
                  stepIcon: { cursor: "default" },
                  separator: { display: "none" },
                  steps: {justifyContent: "space-between"}
                }}
              >
                {MONTHS.slice(6).map((month, i) => (
                  <Stepper.Step
                    key={month}
                    icon={<span style={{ fontSize: 14 }}>{month}</span>}
                    completedIcon={<span style={{ fontSize: 14 }}>{month}</span>}
                    color={uploadedMonths.includes(i + 6) ? "green" : "gray"}
                    state={uploadedMonths.includes(i + 6) ? "stepCompleted" : "stepInactive"}
                    styles={{
                      stepIcon: {
                        backgroundColor: uploadedMonths.includes(i + 6) ? "green" : undefined,
                        borderColor: uploadedMonths.includes(i + 6) ? "green" : undefined,
                        color: uploadedMonths.includes(i + 6) ? "white" : undefined,
                      }
                    }}
                  />
                ))}
              </Stepper>
            </div>
          </div>

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
