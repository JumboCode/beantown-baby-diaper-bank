"use client";

import { Box, Group, Text, Button } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconExternalLink } from "@tabler/icons-react";
import Image from "next/image";
import MakeAnImpact from "./MakeAnImpact";

export default function MapHeader() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <Box
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #e8e8e8",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        padding: isMobile ? "0 12px" : "0 24px",
        height: isMobile ? 52 : 64,
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        zIndex: 1100,
        position: "relative",
      }}
    >
      <Group justify="space-between" align="center" style={{ width: "100%" }} wrap="nowrap">
        {/* Logo + subtitle */}
        <Group gap={isMobile ? 10 : 14} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
          <Image
            src="/beantown-logo.svg"
            alt="Beantown Baby Diaper Bank"
            width={isMobile ? 100 : 130}
            height={isMobile ? 35 : 45}
            style={{ objectFit: "contain", flexShrink: 0 }}
            priority
          />
          {!isMobile && (
            <>
              <Box
                style={{
                  width: 1,
                  height: 28,
                  background: "#e0e0e0",
                  flexShrink: 0,
                }}
              />
              <Text fz="13px" fw={600} c="#1B3668" lh={1.3} style={{ whiteSpace: "nowrap" }}>
                Distribution Impact Map
              </Text>
            </>
          )}
        </Group>

        {/* Actions */}
        <Group gap={isMobile ? 8 : 12} wrap="nowrap" style={{ flexShrink: 0 }}>
          <Button
            component="a"
            href="https://beantownbabydiaperbank.org/"
            target="_blank"
            rel="noopener noreferrer"
            rightSection={<IconExternalLink size={12} />}
            variant="subtle"
            size={isMobile ? "xs" : "sm"}
            styles={{
              root: {
                color: "#1B3668",
                fontWeight: 600,
                fontSize: isMobile ? "12px" : "13px",
                padding: isMobile ? "0 8px" : "0 12px",
                height: isMobile ? 30 : 36,
                "&:hover": {
                  backgroundColor: "transparent",
                  color: "#1B3668",
                  textDecoration: "underline",
                },
              },
            }}
          >
            {isMobile ? "Website" : "Visit Website"}
          </Button>
          <MakeAnImpact />
        </Group>
      </Group>
    </Box>
  );
}
