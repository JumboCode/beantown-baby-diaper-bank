import { FileInput } from "@mantine/core";
import { useState } from "react";

export default function RakshiValentinaTicket() {
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    rows: number;
  } | null>(null);

  const handleFileChange = async (file: File | null) => {
    if (file) {
      const text = await file.text();
      const rows = text.split("\n").length;
      setFileInfo({ name: file.name, rows });
      console.log(
        `Loaded file with ${rows} rows and ${text.length} characters.`,
      );
    }
  };
  return (
    <div>
      <FileInput
        accept="csv"
        label="Upload files"
        onChange={handleFileChange}
        placeholder="Upload files"
      />
      <div>{fileInfo != null && <h1> File name: {fileInfo.name} </h1>}</div>
    </div>
  );
}
