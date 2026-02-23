import { FileInput } from "@mantine/core";
import { Text } from "@mantine/core";

export interface FileInfo {
  name: string;
  rows: number;
  text: string;
}

interface FileUploadProps {
  fileInfo: FileInfo | null;
  onFileChange: (fileInfo: FileInfo | null) => void;
}

export default function FileUpload({ fileInfo, onFileChange }: FileUploadProps) {
  const handleFileChange = async (file: File | null) => {
    if (file) {
      const text = await file.text();
      const rows = text.split("\n").length;
      onFileChange({ name: file.name, rows, text: text });
    } else {
      onFileChange(null);
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
      <div>{fileInfo != null && <h1> File name: {fileInfo.name} </h1>}</div>
      <div>
        {fileInfo != null && <h1> Number of rows: {fileInfo.rows} </h1>}
      </div>
      <div>
        {fileInfo != null && <h1> File content: {fileInfo.text} </h1>}
      </div>
    </div>
  );
}
