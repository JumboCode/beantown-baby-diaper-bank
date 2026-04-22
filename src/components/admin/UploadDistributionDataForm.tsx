import {
  Modal,
  Button,
  Group,
  Text,
  Stack,
  Paper,
  ThemeIcon,
  ActionIcon,
  Title,
  Stepper,
  Tooltip,
  Badge,
  Alert,
} from "@mantine/core";
import FileUpload, { FileInfo } from "./FileUpload";
import { MonthPickerInput, MonthPickerProps } from "@mantine/dates";
import { useState } from "react";
import { FaDownload } from "react-icons/fa";
import { modals } from "@mantine/modals";
import {
  IconTrash,
  IconFileText,
  IconCircleX,
  IconCalendar,
  IconClipboardCheck,
  IconUpload,
} from "@tabler/icons-react";
import UploadedMonths from "./UploadedMonths";
import dayjs from "dayjs";

interface UploadNewDataProps {
  opened: boolean;
  onClose: () => void;
  onUploaded?: () => Promise<void> | void;
  uploadedMonths: number[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function UploadNewData({
  opened,
  onClose,
  onUploaded,
  uploadedMonths,
}: UploadNewDataProps) {
  const [fileEntries, setFileEntries] = useState<
    { fileInfo: FileInfo; datasetMonth: string | null }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(0);

  const handleClose = () => {
    setWarnings([]);
    setFileEntries([]);
    setActiveStep(0);
    onClose();
  };

  const currentYear = new Date().getFullYear();
  const uploadedMonthSet = new Set(uploadedMonths);
  const getMonthControlProps: MonthPickerProps["getMonthControlProps"] = (date) => {
    if (takenByOthers.has(`${dayjs(date).year()}-${dayjs(date).month()}`)) {
      return {
        disabled: true,
        title: "This month is currently selected for another file.",
      };
    }
    if (uploadedMonthSet.has(dayjs(date).month())) {
      return {
        style: {
          color: "var(--mantine-color-yellow-9)",
          backgroundColor: "var(--mantine-color-yellow-1)",
          border: "1px solid var(--mantine-color-yellow-4)",
          borderRadius: "4px",
          fontWeight: 600,
        },
        title: "Warning: Uploading to this month will overwrite existing data.",
      };
    }

    return {};
  };

  const validFileEntries = fileEntries.filter(
    (e) => !e.fileInfo.errors || e.fileInfo.errors.length === 0,
  );
  const takenByOthers = new Set(
    validFileEntries.flatMap((e) => {
      const d = e.datasetMonth ? new Date(e.datasetMonth as any) : null;
      return d && !isNaN(d.getTime()) ? [`${d.getUTCFullYear()}-${d.getUTCMonth()}`] : [];
    }),
  );
  const hasFileErrors = fileEntries.some((e) => e.fileInfo.errors && e.fileInfo.errors.length > 0);

  const allFilesHaveDates =
    validFileEntries.length > 0 && validFileEntries.every((e) => e.datasetMonth);

  const step0Complete = fileEntries.length > 0;
  const step1Complete =
    validFileEntries.length > 0 && validFileEntries.every((e) => e.datasetMonth);

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, 2));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const uploadFiles = async () => {
    setIsUploading(true);
    try {
      for (const entry of validFileEntries) {
        const response = await fetch("/api/distributions/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            csv: entry.fileInfo.text,
            selectedDate: entry.datasetMonth,
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
      }

      await onUploaded?.();
      handleClose();
    } catch (error) {
      console.error("Failed to upload distribution data:", error);
      setWarnings(["Upload failed. Please try again."]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    setWarnings([]);

    const parsedEntries = validFileEntries.map((entry) => ({
      entry,
      parsedDate: new Date(entry.datasetMonth!),
    }));

    if (parsedEntries.some(({ parsedDate }) => Number.isNaN(parsedDate.getTime()))) {
      setWarnings(["One or more selected dates are invalid."]);
      return;
    }

    const selectedKeys = parsedEntries.map(
      ({ parsedDate }) => `${parsedDate.getUTCFullYear()}-${parsedDate.getUTCMonth()}`,
    );
    if (new Set(selectedKeys).size !== selectedKeys.length) {
      setWarnings(["Each file must have a unique month. Remove the duplicate before uploading."]);
      return;
    }

    const conflictingMonths = parsedEntries
      .filter(
        ({ parsedDate }) =>
          parsedDate.getUTCFullYear() === currentYear &&
          uploadedMonthSet.has(parsedDate.getUTCMonth()),
      )
      .map(
        ({ parsedDate }) => `${MONTHS[parsedDate.getUTCMonth()]} ${parsedDate.getUTCFullYear()}`,
      );

    if (conflictingMonths.length > 0) {
      modals.openConfirmModal({
        title: (
          <Text fw={700} size="xl" c="brand">
            Confirm Upload
          </Text>
        ),
        centered: true,
        size: "md",
        children: (
          <Stack gap="sm">
            <Text size="sm">
              The following {conflictingMonths.length === 1 ? "month" : "months"} already{" "}
              {conflictingMonths.length === 1 ? "has" : "have"} data that will be overwritten:
            </Text>
            <Stack gap={4}>
              {conflictingMonths.map((month) => (
                <Text key={month} size="sm" fw={600} c="brand">
                  • {month}
                </Text>
              ))}
            </Stack>
            <Text size="sm" c="dimmed">
              This action cannot be undone.
            </Text>
          </Stack>
        ),
        labels: { confirm: "Upload", cancel: "Cancel" },
        confirmProps: { color: "brand" },
        onConfirm: uploadFiles,
        groupProps: { justify: "center", grow: true, align: "stretch" },
      });
      return;
    }

    await uploadFiles();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text fw={700} size="30px" c="var(--color-text-heading)">
          Upload New Dataset
        </Text>
      }
      size="xl"
    >
      <Stack gap="md">
        <Stepper active={activeStep} size="sm" onStepClick={setActiveStep}>
          {/* STEP 1 */}
          <Stepper.Step
            label="Upload Files"
            description="Select CSV files"
            icon={<IconUpload size={18} />}
          >
            <Stack gap="md" mt="md">
              <Group grow>
                <FileUpload
                  files={fileEntries.map((entry) => entry.fileInfo)}
                  onFileChange={(newFiles) =>
                    setFileEntries((prev) => {
                      return newFiles.map((file) => {
                        const existing = prev.find((p) => p.fileInfo.name === file.name);
                        return existing ? existing : { fileInfo: file, datasetMonth: null };
                      });
                    })
                  }
                />
              </Group>

              {fileEntries.length > 0 && (
                <Group gap="sm" mt={4}>
                  {fileEntries.map((entry, index) => {
                    const hasError = entry.fileInfo.errors && entry.fileInfo.errors.length > 0;
                    return (
                      <Tooltip
                        key={`${entry.fileInfo.name}-${index}`}
                        label={
                          hasError
                            ? "This file has errors. Click to view errors."
                            : "This file is valid. Click to set the dataset month."
                        }
                        withArrow
                        multiline
                        maw={300}
                      >
                        <Badge
                          component="button"
                          onClick={nextStep}
                          variant="light"
                          color={hasError ? "red" : "brand"}
                          leftSection={<IconFileText size={14} />}
                          size="md"
                          radius="sm"
                          style={{ textTransform: "none", fontWeight: 600, cursor: "pointer" }}
                        >
                          {entry.fileInfo.name}
                        </Badge>
                      </Tooltip>
                    );
                  })}
                </Group>
              )}

              <Text size="xs" c="dimmed">
                File must be a CSV (.csv)
              </Text>
            </Stack>
          </Stepper.Step>

          {/* STEP 2 */}
          <Stepper.Step
            label="Set Dates"
            description="Assign a month to each file"
            color={hasFileErrors ? "red" : undefined}
            icon={hasFileErrors ? <IconCircleX size={20} /> : <IconCalendar size={18} />}
            completedIcon={hasFileErrors ? <IconCircleX size={20} /> : undefined}
            allowStepSelect={fileEntries.length > 0}
          >
            <Stack gap="md" mt="md">
              <UploadedMonths currentYear={currentYear} uploadedMonthSet={uploadedMonthSet} />
              {fileEntries.length > 0 ? (
                <Group justify="space-between" align="center">
                  <Title order={3} fw={600} fz={16} c="var(--color-text-heading)">
                    {fileEntries.length} file{fileEntries.length !== 1 ? "s" : ""} selected
                    {validFileEntries.length < fileEntries.length && (
                      <Text component="span" size="sm" c="red.6" fw={400} ml={6}>
                        ({fileEntries.length - validFileEntries.length} with errors)
                      </Text>
                    )}
                  </Title>
                  <Button variant="subtle" color="red" size="xs" onClick={() => setFileEntries([])}>
                    Clear All
                  </Button>
                </Group>
              ) : (
                <Paper
                  withBorder
                  p="xl"
                  radius="md"
                  bg="var(--mantine-color-gray-0)"
                  onClick={() => setActiveStep(0)}
                  style={{ cursor: "pointer", textAlign: "center" }}
                >
                  <Text fw={600} size="md" c="dimmed">
                    No files selected
                  </Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    Click here to return to the upload step
                  </Text>
                </Paper>
              )}

              {fileEntries.map((entry, index) => {
                const hasErrors = entry.fileInfo.errors && entry.fileInfo.errors.length > 0;

                if (hasErrors) {
                  return (
                    <Paper
                      key={`${entry.fileInfo.name}-${index}`}
                      withBorder
                      p="sm"
                      radius="md"
                      bg="red.0"
                      style={{ borderColor: "var(--mantine-color-red-4)" }}
                    >
                      <Stack gap="sm">
                        <Group justify="space-between" wrap="nowrap" align="center">
                          <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                            <ThemeIcon size="lg" radius="md" variant="light" color="red">
                              <IconFileText size={20} />
                            </ThemeIcon>
                            <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                              <Text fw={600} size="sm" truncate c="red.9">
                                {entry.fileInfo.name}
                              </Text>
                              <Group gap="xs" wrap="nowrap">
                                <Text size="xs" c="red.7">
                                  {entry.fileInfo.rows} rows
                                </Text>
                              </Group>
                            </Stack>
                          </Group>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => {
                              setFileEntries((prev) => prev.filter((_, idx) => idx !== index));
                            }}
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
                        <Alert
                          variant="subtle"
                          color="red"
                          p="xs"
                          styles={{ title: { fontSize: "0.85rem" } }}
                        >
                          <Stack gap={4}>
                            {entry.fileInfo.errors!.map((err, i) => (
                              <Text key={i} size="xs" fw={500}>
                                {err}
                              </Text>
                            ))}
                          </Stack>
                        </Alert>
                      </Stack>
                    </Paper>
                  );
                }

                return (
                  <Paper key={`${entry.fileInfo.name}-${index}`} withBorder p="sm" radius="md">
                    <Group justify="space-between" wrap="nowrap" align="center">
                      <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                        <ThemeIcon size="lg" radius="md" variant="light" color="brand">
                          <IconFileText size={20} />
                        </ThemeIcon>
                        <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                          <Text fw={600} size="sm" truncate>
                            {entry.fileInfo.name}
                          </Text>
                          <Group gap="xs" wrap="nowrap">
                            <Text size="xs" c="dimmed">
                              {entry.fileInfo.rows} rows
                            </Text>
                            <Text size="xs" c="dimmed">
                              ·
                            </Text>
                            <Text size="xs" c="dimmed">
                              {entry.fileInfo.organizations} org
                              {entry.fileInfo.organizations !== 1 ? "s" : ""}
                            </Text>
                            <Text size="xs" c="dimmed">
                              ·
                            </Text>
                            <Text size="xs" c="dimmed">
                              {entry.fileInfo.totalDiapers.toLocaleString()} diapers
                            </Text>
                          </Group>
                        </Stack>
                      </Group>
                      <Group wrap="nowrap" gap="sm">
                        <MonthPickerInput
                          getMonthControlProps={getMonthControlProps}
                          placeholder="Select Date"
                          value={entry.datasetMonth as any}
                          onChange={(value) =>
                            setFileEntries((prev) =>
                              prev.map((prevEntry, idx) =>
                                idx === index
                                  ? { ...prevEntry, datasetMonth: value as any }
                                  : prevEntry,
                              ),
                            )
                          }
                          required
                          valueFormat="YYYY MMM"
                          w={140}
                          styles={{ input: { fontWeight: 500 } }}
                        />
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => {
                            setFileEntries((prev) => prev.filter((_, idx) => idx !== index));
                          }}
                        >
                          <IconTrash size={18} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          </Stepper.Step>

          <Stepper.Step
            label="Review & Upload"
            description="Confirm and upload"
            allowStepSelect={allFilesHaveDates}
            icon={<IconClipboardCheck size={18} />}
          >
            <Stack gap="md" mt="md">
              <Title order={3} fw={600} fz={16} c="var(--color-text-heading)">
                Review your upload
              </Title>

              {warnings.length > 0 && (
                <Alert color="red" title="Please fix the following:">
                  <Stack gap={4}>
                    {warnings.map((warning) => (
                      <Text key={warning} size="sm">
                        {warning}
                      </Text>
                    ))}
                  </Stack>
                </Alert>
              )}

              {validFileEntries.map((entry, index) => {
                const parsedDate = entry.datasetMonth ? new Date(entry.datasetMonth as any) : null;
                const monthLabel =
                  parsedDate && !isNaN(parsedDate.getTime())
                    ? `${MONTHS[parsedDate.getUTCMonth()]} ${parsedDate.getUTCFullYear()}`
                    : "—";
                const isConflict =
                  parsedDate &&
                  parsedDate.getUTCFullYear() === currentYear &&
                  uploadedMonthSet.has(parsedDate.getUTCMonth());

                return (
                  <Paper
                    key={`${entry.fileInfo.name}-${index}`}
                    withBorder
                    p="sm"
                    radius="md"
                    bg={isConflict ? "yellow.0" : undefined}
                    style={
                      isConflict ? { borderColor: "var(--mantine-color-yellow-4)" } : undefined
                    }
                  >
                    <Group justify="space-between" wrap="nowrap" align="center">
                      <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                        <ThemeIcon size="lg" radius="md" variant="light" color="brand">
                          <IconFileText size={20} />
                        </ThemeIcon>
                        <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                          <Text fw={600} size="sm" truncate>
                            {entry.fileInfo.name}
                          </Text>
                          <Group gap="xs" wrap="nowrap">
                            <Text size="xs" c="dimmed">
                              {entry.fileInfo.rows} rows
                            </Text>
                            <Text size="xs" c="dimmed">
                              ·
                            </Text>
                            <Text size="xs" c="dimmed">
                              {entry.fileInfo.organizations} org
                              {entry.fileInfo.organizations !== 1 ? "s" : ""}
                            </Text>
                            <Text size="xs" c="dimmed">
                              ·
                            </Text>
                            <Text size="xs" c="dimmed">
                              {entry.fileInfo.totalDiapers.toLocaleString()} diapers
                            </Text>
                          </Group>
                        </Stack>
                      </Group>
                      <Stack gap={2} align="flex-end">
                        <Badge color={isConflict ? "yellow" : "brand"} variant="light">
                          {monthLabel}
                        </Badge>
                        {isConflict && (
                          <Text size="xs" c="yellow.7" fw={500}>
                            Will overwrite existing data
                          </Text>
                        )}
                      </Stack>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          </Stepper.Step>
        </Stepper>
        <Group
          justify="flex-end"
          mt="md"
          style={{
            position: "sticky",
            bottom: 0,
            backgroundColor: "white",
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 32,
            paddingRight: 32,
            borderTop: "1px solid var(--mantine-color-gray-1)",
            zIndex: 10,
            margin: "auto -32px -32px -32px",
          }}
        >
          {activeStep === 0 && (
            <>
              <Button
                component="a"
                href="/MothlyDataTemplate.xlsx"
                download
                leftSection={<FaDownload />}
                color="brand"
                radius="md"
                variant="subtle"
              >
                Download Template
              </Button>
              <Button
                variant="outline"
                color="brand"
                radius="md"
                type="button"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="filled"
                color="brand"
                radius="md"
                onClick={nextStep}
                disabled={!step0Complete}
              >
                Next
              </Button>
            </>
          )}
          {activeStep === 1 && (
            <>
              <Button variant="outline" color="brand" radius="md" onClick={prevStep}>
                Back
              </Button>
              <Button
                variant="filled"
                color="brand"
                radius="md"
                onClick={nextStep}
                disabled={!step1Complete}
              >
                Next
              </Button>
            </>
          )}
          {activeStep === 2 && (
            <>
              <Button variant="outline" color="brand" radius="md" onClick={prevStep}>
                Back
              </Button>
              <Button
                variant="filled"
                color="brand"
                radius="md"
                onClick={handleUpload}
                loading={isUploading}
              >
                Upload Datasets
              </Button>
            </>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
