"use client";

import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { Text, Stack, Image, Button, Badge } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import "@mantine/dropzone/styles.css";

interface LogoDropzoneProps {
  file: File | null;
  existingUrl?: string;
  error?: string;
  onChange: (file: File | null) => void;
}

type PreviewSource = "new-file" | "saved-url" | "none";

export default function LogoDropzone({ file, existingUrl, error, onChange }: LogoDropzoneProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl || null);
  const [source, setSource] = useState<PreviewSource>(existingUrl ? "saved-url" : "none");
  const openRef = useRef<() => void>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSource("new-file");
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleDrop = (files: File[]) => {
    if (files[0]) onChange(files[0]);
  };

  const handleRemoveNewFile = () => {
    onChange(null);
    if (existingUrl) {
      setPreviewUrl(existingUrl);
      setSource("saved-url");
    } else {
      setPreviewUrl(null);
      setSource("none");
    }
  };

  const hasPreview = previewUrl !== null;

  return (
    <Stack gap={8}>
      <Dropzone
        openRef={openRef}
        onDrop={handleDrop}
        onReject={() => {}}
        accept={IMAGE_MIME_TYPE}
        multiple={false}
        radius="md"
        style={{
          borderColor: error ? "var(--mantine-color-red-6)" : undefined,
          minHeight: 140,
          position: "relative",
        }}
      >
        {hasPreview ? (
          <Stack align="center" gap={10} py={8} style={{ pointerEvents: "none" }}>
            {source === "new-file" && existingUrl && (
              <Button
                size="xs"
                variant="outline"
                color="red"
                radius="md"
                pos="absolute"
                top={8}
                right={8}
                style={{ pointerEvents: "all" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveNewFile();
                }}
              >
                Revert to saved
              </Button>
            )}
            <Image
              src={previewUrl}
              alt="Logo preview"
              fit="contain"
              h={80}
              w="auto"
              style={{ maxWidth: 180 }}
            />
            {source === "saved-url" && (
              <Badge size="sm" variant="light" color="gray">
                Currently saved
              </Badge>
            )}
            <Text size="xs" c="dimmed" style={{ pointerEvents: "none" }}>
              Click or drag to replace
            </Text>
          </Stack>
        ) : (
          <Stack
            align="center"
            justify="center"
            gap={6}
            mih={110}
            style={{ pointerEvents: "none" }}
          >
            <Dropzone.Accept>
              <Text size="sm" c="blue" fw={500}>
                Drop image here
              </Text>
            </Dropzone.Accept>
            <Dropzone.Reject>
              <Text size="sm" c="red" fw={500}>
                Only PNG/JPEG accepted
              </Text>
            </Dropzone.Reject>
            <Dropzone.Idle>
              <Text size="sm" c="dimmed" ta="center">
                Drag &amp; drop a logo, or click to select
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                PNG or JPEG
              </Text>
            </Dropzone.Idle>
          </Stack>
        )}
      </Dropzone>
      {error && (
        <Text size="xs" c="red">
          {error}
        </Text>
      )}
    </Stack>
  );
}
