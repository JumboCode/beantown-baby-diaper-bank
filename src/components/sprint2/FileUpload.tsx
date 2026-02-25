import { FileInput } from "@mantine/core";
import { Text } from "@mantine/core";
import { useState } from "react";

export interface FileInfo {
  name: string;
  rows: number;
  text: string;
}

interface FileUploadProps {
  fileInfo?: FileInfo | null;
  onFileChange?: (fileInfo: FileInfo | null) => void;
}

export default function FileUpload({
  fileInfo,
  onFileChange,
}: FileUploadProps) {
  const [internalFileInfo, setInternalFileInfo] = useState<FileInfo | null>(
    null,
  );
  const displayedFileInfo = fileInfo ?? internalFileInfo;

  const updateFile = (next: FileInfo | null) => {
    if (onFileChange) {
      onFileChange(next);
      return;
    }
    setInternalFileInfo(next);
  };

  const handleFileChange = async (file: File | null) => {
    if (file) {
      const text = await file.text();
      const rows = text.split("\n").length;
      updateFile({ name: file.name, rows, text });
    } else {
      updateFile(null);
    }
  };

  return (
    <div>
      <FileInput
        accept="csv"
        label={<Text fw={700}>Files</Text>}
        onChange={handleFileChange}
        placeholder={<Text size="sm">Click to Upload</Text>}
        description="Upload one or more dataset files"
      />
      <div>
        {displayedFileInfo != null && (
          <h1> File name: {displayedFileInfo.name} </h1>
        )}
      </div>
      <div>
        {displayedFileInfo != null && (
          <h1> Number of rows: {displayedFileInfo.rows} </h1>
        )}
      </div>
    </div>
  );
}
