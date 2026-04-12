import { FileInput, Stack, Text } from "@mantine/core";
import { useState } from "react";

export interface FileInfo {
  name: string;
  rows: number;
  text: string;
}

interface FileUploadProps {
  files?: FileInfo[];
  onFileChange?: (files: FileInfo[]) => void;
}

export default function FileUpload({
  files,
  onFileChange,
}: FileUploadProps) {
  const [internalFiles, setInternalFiles] = useState<FileInfo[]>([]);
  const displayedFiles = files ?? internalFiles;

  const updateFiles = (next: FileInfo[]) => {
    if (onFileChange) {
      onFileChange(next);
      return;
    }
    setInternalFiles(next);
  };

  const handleFileChange = async (selected: File[] | null) => {
    if (!selected || selected.length === 0) {
      updateFiles([]);
      return;
    }

    const nextFiles = await Promise.all(
      selected.map(async (file) => {
        const text = await file.text();
        const rows = text.split("\n").length;
        return { name: file.name, rows, text };
      }),
    );

    updateFiles(nextFiles);
  };

  return (
    <div>
      <FileInput
        required
        accept="csv"
        label="Files"
        multiple
        onChange={handleFileChange}
        placeholder={<Text size="sm">Click to Upload</Text>}
        description="Upload one or more dataset files"
        styles={{
          label: {
            fontWeight: 700,
            fontSize: "1rem",
          },
        }}
      />
    </div>
  );
}
