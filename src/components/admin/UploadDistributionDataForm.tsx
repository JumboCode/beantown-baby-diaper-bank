import {
  Modal,
  Button,
  Group,
  Text,
  Stack,
  SimpleGrid,
  Paper,
  Box,
  Alert,
  ThemeIcon,
  ActionIcon,
  Title,
} from "@mantine/core";
import FileUpload, { FileInfo } from "./FileUpload";
import { MonthPickerInput } from "@mantine/dates";
import { useState } from "react";
import { FaDownload } from "react-icons/fa";
// import { ConfirmUpload } from "./ConfirmUploadModal";
import { modals } from "@mantine/modals";
import { IconTrash, IconFileText } from "@tabler/icons-react";

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

  const handleClose = () => {
    setWarnings([]);
    setFileEntries([]);
    onClose();
  };

  const currentYear = new Date().getFullYear();
  const uploadedMonthSet = new Set(uploadedMonths);

  const uploadFiles = async () => {
    setIsUploading(true);
    try {
      for (const entry of fileEntries) {
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
    if (fileEntries.length === 0) return;
    if (fileEntries.some((entry) => !entry.datasetMonth)) {
      setWarnings(["Please choose a dataset time for every file."]);
      return;
    }

    const parsedEntries = fileEntries.map((entry) => ({
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
          <Text fw={700} size="xl">
            Confirm Upload
          </Text>
        ),
        centered: true,
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
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title={
          <Text fw={700} size="30px" c="var(--color-text-heading)">
            Upload New Dataset
          </Text>
        }
      >
        <Title order={2} c="dimmed" fw="normal" fz={18} mb="md">
          Add your new distribution data
        </Title>
        <Stack gap="md">
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

          <Paper
            withBorder
            radius="md"
            p="md"
            style={{
              borderColor: "var(--mantine-color-gray-3)",
              backgroundColor: "var(--mantine-color-gray-0)",
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
                      backgroundColor: "var(--mantine-color-green-7)",
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
                      backgroundColor: "var(--mantine-color-gray-4)",
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
                      backgroundColor: isUploaded
                        ? "var(--mantine-color-green-0)"
                        : "var(--mantine-color-white)",
                      borderColor: isUploaded
                        ? "var(--mantine-color-green-3)"
                        : "var(--mantine-color-gray-2)",
                      transition: "transform 150ms ease, box-shadow 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "var(--mantine-shadow-sm)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <Text fw={700} size="md" c="var(--color-text-heading)">
                      {month}
                    </Text>
                    <Text
                      size="xs"
                      fw={600}
                      c={isUploaded ? "green.6" : "dimmed"}
                      style={{ lineHeight: 1.2 }}
                    >
                      {isUploaded ? "Uploaded" : "Missing"}
                    </Text>
                  </Paper>
                );
              })}
            </SimpleGrid>
          </Paper>
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
            <Stack mt="md" gap="md">
              <Group justify="space-between" align="center">
                <Text fw={700} size="sm">
                  Set distribution month for {fileEntries.length} File
                  {fileEntries.length !== 1 ? "s" : ""}
                </Text>
                <Button variant="subtle" color="red" size="xs" onClick={() => setFileEntries([])}>
                  Clear All
                </Button>
              </Group>
              {fileEntries.map((entry, index) => {
                const takenByOthers = new Set(
                  fileEntries
                    .filter((_, j) => j !== index)
                    .flatMap((e) => {
                      const d = e.datasetMonth ? new Date(e.datasetMonth as any) : null;
                      return d && !isNaN(d.getTime())
                        ? [`${d.getUTCFullYear()}-${d.getUTCMonth()}`]
                        : [];
                    }),
                );
                const hasErrors = entry.fileInfo.errors && entry.fileInfo.errors.length > 0;

                return (
                  <Paper
                    key={`${entry.fileInfo.name}-${index}`}
                    withBorder
                    p="sm"
                    radius="md"
                    bg={hasErrors ? "red.0" : undefined}
                    style={hasErrors ? { borderColor: "var(--mantine-color-red-4)" } : undefined}
                  >
                    <Stack gap="sm">
                      <Group justify="space-between" wrap="nowrap" align="center">
                        <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                          <ThemeIcon
                            size="lg"
                            radius="md"
                            variant="light"
                            color={hasErrors ? "red" : "brand"}
                          >
                            <IconFileText size={20} />
                          </ThemeIcon>
                          <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                            <Text fw={600} size="sm" truncate c={hasErrors ? "red.9" : undefined}>
                              {entry.fileInfo.name}
                            </Text>
                            <Group gap="xs" wrap="nowrap">
                              <Text size="xs" c={hasErrors ? "red.7" : "dimmed"}>
                                {entry.fileInfo.rows} rows
                              </Text>
                              {!hasErrors && (
                                <>
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
                                </>
                              )}
                            </Group>
                          </Stack>
                        </Group>

                        <Group wrap="nowrap" gap="sm">
                          <MonthPickerInput
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
                            getMonthControlProps={(date) => {
                              const d = new Date(date);
                              return {
                                disabled: takenByOthers.has(
                                  `${d.getUTCFullYear()}-${d.getUTCMonth()}`,
                                ),
                              };
                            }}
                            required={!hasErrors}
                            disabled={hasErrors}
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
                      {hasErrors && (
                        <Alert variant="subtle" p="xs" styles={{ title: { fontSize: "0.85rem" } }}>
                          <Stack gap={4}>
                            {entry.fileInfo.errors!.map((err, i) => (
                              <Text key={i} size="xs" fw={500}>
                                {err}
                              </Text>
                            ))}
                          </Stack>
                        </Alert>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
          <Text size="xs" c="dimmed">
            File must be a CSV (.csv)
          </Text>

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
            <Button variant="outline" color="brand" radius="md" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="filled"
              color="brand"
              radius="md"
              onClick={handleUpload}
              disabled={
                fileEntries.length === 0 ||
                fileEntries.some(
                  (entry) =>
                    !entry.datasetMonth ||
                    (entry.fileInfo.errors && entry.fileInfo.errors.length > 0),
                ) ||
                isUploading
              }
              loading={isUploading}
            >
              Upload Datasets
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
