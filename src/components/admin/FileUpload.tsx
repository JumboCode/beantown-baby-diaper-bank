import { Group, Stack, Text, rem } from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { IconUpload, IconX, IconFileText } from "@tabler/icons-react";
import { useState } from "react";
import "@mantine/dropzone/styles.css";

export interface FileInfo {
  name: string;
  rows: number;
  totalDiapers: number;
  organizations: number;
  text: string;
  errors?: string[];
}

interface FileUploadProps {
  files?: FileInfo[];
  onFileChange?: (files: FileInfo[]) => void;
}

export default function FileUpload({ files, onFileChange }: FileUploadProps) {
  const [internalFiles, setInternalFiles] = useState<FileInfo[]>([]);
  const currentFiles = files ?? internalFiles;

  const updateFiles = (next: FileInfo[]) => {
    if (onFileChange) {
      onFileChange(next);
      return;
    }
    setInternalFiles(next);
  };

  const handleDrop = async (selected: File[]) => {
    if (!selected || selected.length === 0) {
      return;
    }

    const nextFiles = await Promise.all(
      selected.map(async (file) => {
        const text = await file.text();
        const lines = text.split("\n").filter((l) => l.trim());
        const dataRows = lines.slice(1); // skip header
        const rows = dataRows.length;

        let totalDiapers = 0;
        const orgNames = new Set<string>();
        for (const line of dataRows) {
          const cols = line.split(",");
          const name = cols[0]?.trim();
          if (name) orgNames.add(name);
          const raw = cols[1]?.replace(/,/g, "").trim();
          const val = raw ? Number(raw) : NaN;
          if (Number.isFinite(val)) totalDiapers += val;
        }
        const organizations = orgNames.size;

        let errors: string[] = [];
        if (rows === 0) {
          errors = ["This file is empty. Please upload a CSV with at least one data row."];
        } else {
          try {
            const res = await fetch("/api/distributions/validate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ csv: text }),
            });
            const data = await res.json();
            if (data.errors) errors = data.errors;
          } catch {
            errors = ["Failed to reach validation service."];
          }
        }

        return { name: file.name, rows, totalDiapers, organizations, text, errors };
      }),
    );

    const newFiles = [...currentFiles, ...nextFiles];
    const uniqueFiles = newFiles.filter((v, i, a) => a.findIndex((v2) => v2.name === v.name) === i);

    updateFiles(uniqueFiles);
  };

  return (
    <Stack gap="xs">
      <div>
        <Text component="label" style={{ fontWeight: 700, fontSize: "1rem" }}>
          Files
        </Text>
        <Text size="sm" c="dimmed">
          Upload one or more dataset files
        </Text>
      </div>

      <Dropzone
        onDrop={handleDrop}
        onReject={(files) => console.log("rejected files", files)}
        accept={[MIME_TYPES.csv]}
      >
        <Group justify="center" gap="xl" mih={120} style={{ pointerEvents: "none" }}>
          <Dropzone.Accept>
            <IconUpload
              style={{ width: rem(32), height: rem(32), color: "var(--mantine-color-blue-6)" }}
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              style={{ width: rem(32), height: rem(32), color: "var(--mantine-color-red-6)" }}
              stroke={1.5}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconFileText
              style={{ width: rem(32), height: rem(32), color: "var(--mantine-color-dimmed)" }}
              stroke={1.5}
            />
          </Dropzone.Idle>

          <div>
            <Text size="md" inline>
              Drag files here or click to select files
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Attach one or more CSV files for upload.
            </Text>
          </div>
        </Group>
      </Dropzone>
    </Stack>
  );
}
