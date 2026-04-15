import type { Partner } from "@/generated/prisma/client";

import {
  Drawer,
  Skeleton,
  Stack,
  Group,
  Text,
  Title,
  Box,
  ThemeIcon,
  Divider,
  Badge,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconMapPin,
  IconBabyCarriage,
  IconCalendar,
  IconAlignLeft,
  IconChartBar,
  IconUsersGroup,
  IconX,
  IconBuildingStore,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { GeoJsonBoundaries } from "@/lib/types";
import { PartnerMiniMap } from "./PartnerMiniMap";

const statusDisplay = (status: Partner["status"]) => {
  if (!status)
    return {
      label: "Unknown",
      bg: "rgba(255,255,255,0.15)",
      color: "white",
      border: "rgba(255,255,255,0.25)",
    };
  if (status === "active")
    return {
      label: "Active",
      bg: "rgba(16,185,129,0.2)",
      color: "#6ee7b7",
      border: "rgba(16,185,129,0.4)",
    };
  if (status === "inactive")
    return {
      label: "Inactive",
      bg: "rgba(239,68,68,0.2)",
      color: "#fca5a5",
      border: "rgba(239,68,68,0.35)",
    };
  return {
    label: "Waitlisted",
    bg: "rgba(251,191,36,0.2)",
    color: "#fde68a",
    border: "rgba(251,191,36,0.35)",
  };
};

type PartnerCoordinates = {
  lat: number;
  lng: number;
};

export interface PartnerWithStats extends Omit<Partner, "coords" | "startPartner" | "endPartner"> {
  partner_id: number;
  logoUrl: string | null;
  coordinates?: PartnerCoordinates | null;
  coords?: PartnerCoordinates | null;
  startPartner: Date | null;
  endPartner: Date | null;
  number_babies_helped: number | null;
  number_diapers: number;
  citiesServed: string[];
}

export interface PartnerDrawerProps {
  partnerId?: number;
  onClose: () => void;
  boundaries: GeoJsonBoundaries;
}

export default function PartnerDrawer({ partnerId, onClose, boundaries }: PartnerDrawerProps) {
  const [partner, setPartner] = useState<PartnerWithStats>();
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (partnerId) {
      setLoading(true);
      fetchPartnerDetails(partnerId)
        .then((data) => {
          setPartner(data);
        })
        .catch((err) => {
          console.error("Failed to fetch partner details", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setPartner(undefined);
    }
  }, [partnerId]);

  async function fetchPartnerDetails(id: number) {
    const response = await fetch(`/api/partners/${id}`);
    const result = await response.json();
    const partner = result.data as PartnerWithStats;
    partner.startPartner = partner.startPartner ? new Date(partner.startPartner) : null;
    partner.endPartner = partner.endPartner ? new Date(partner.endPartner) : null;
    partner.citiesServed = partner.citiesServed.map((c) => String(Object(c).id));
    partner.coords = partner.coordinates ?? null;
    return partner;
  }

  return (
    <Drawer
      opened={!!partnerId}
      onClose={onClose}
      position={isMobile ? "bottom" : "right"}
      padding={0}
      size={isMobile ? "85%" : "35%"}
      withCloseButton={false}
      overlayProps={{ opacity: 0.2 }}
    >
      {/* Gradient header */}
      <Box
        style={{
          background: "linear-gradient(135deg, #1B3668 0%, #162C58 55%, #2471A3 100%)",
          borderRadius: "0 0 0 0",
          padding: "20px 20px 18px",
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        {loading ? (
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Group gap={14} wrap="nowrap" align="center">
              <Skeleton height={52} width={52} radius="md" />
              <Stack gap={6}>
                <Skeleton height={20} width={160} radius="sm" />
                <Skeleton height={16} width={90} radius="xl" />
              </Stack>
            </Group>
            <Skeleton height={26} width={26} radius="md" />
          </Group>
        ) : partner ? (
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Group gap={14} wrap="nowrap" align="center" style={{ minWidth: 0 }}>
              {/* Logo or fallback avatar */}
              <Box
                style={{
                  width: 52,
                  height: 52,
                  background: "rgba(255,255,255,1)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: partner.logoUrl ? "0.4rem" : 0,
                  border: "1px solid rgba(255,255,255,0.2)",
                  flexShrink: 0,
                  backdropFilter: "blur(4px)",
                }}
              >
                {partner.logoUrl ? (
                  <img
                    src={partner.logoUrl}
                    alt={`${partner.name} logo`}
                    style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 6 }}
                  />
                ) : (
                  <IconBuildingStore size={26} color="rgba(255,255,255,0.7)" />
                )}
              </Box>

              {/* Name + status */}
              <Stack gap={5} style={{ minWidth: 0 }}>
                <Title
                  order={3}
                  fz="18px"
                  fw={800}
                  c="white"
                  lh={1.2}
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {partner.name}
                </Title>
                <Group gap={8} wrap="nowrap" align="center">
                  {(() => {
                    const s = statusDisplay(partner.status);
                    return (
                      <Badge
                        radius="xl"
                        fw={700}
                        size="sm"
                        style={{
                          background: s.bg,
                          color: s.color,
                          border: `1px solid ${s.border}`,
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        {s.label}
                      </Badge>
                    );
                  })()}
                  {partner.status === "active" && partner.startPartner && (
                    <Text fz="11px" c="rgba(255,255,255,0.6)" fw={500}>
                      Since {partner.startPartner.getFullYear()}
                    </Text>
                  )}
                </Group>
              </Stack>
            </Group>

            {/* Close button */}
            <Box
              component="button"
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 6,
                cursor: "pointer",
                padding: "3px 4px",
                color: "rgba(255,255,255,0.8)",
                display: "flex",
                alignItems: "center",
                lineHeight: 0,
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <IconX size={13} />
            </Box>
          </Group>
        ) : null}
      </Box>

      {/* Body */}
      <Box p="xl">
        {loading ? (
          <Stack gap="lg" mt="md">
            <Skeleton height={100} radius="md" />
            <Group grow>
              <Skeleton height={80} radius="md" />
              <Skeleton height={80} radius="md" />
            </Group>
            <Group grow>
              <Skeleton height={100} radius="md" />
              <Skeleton height={100} radius="md" />
            </Group>
          </Stack>
        ) : (
          partner && (
            <Stack gap="lg" mt="xs">
              {/* Description */}
              <Box
                style={{
                  border: "1px solid #E4ECF4",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <Box
                  style={{
                    background: "linear-gradient(90deg, #e0e8f5 0%, #edf1f8 100%)",
                    borderBottom: "1px solid #c5d2e9",
                    padding: "8px 12px",
                  }}
                >
                  <Group gap={7} align="center">
                    <ThemeIcon
                      size={22}
                      radius="xl"
                      styles={{ root: { backgroundColor: "#c5d2e9", color: "#1B3668" } }}
                    >
                      <IconAlignLeft size={12} />
                    </ThemeIcon>
                    <Text fz="11px" fw={800} c="#1B3668" tt="uppercase" lts="0.06em">
                      About
                    </Text>
                  </Group>
                </Box>
                <Box p={12}>
                  {partner.description ? (
                    <Text c="#344054" lh={1.7} fw={500} fz="0.9rem">
                      {partner.description}
                    </Text>
                  ) : (
                    <Text c="#9ca3af" fs="italic" fz="0.9rem">
                      No description available.
                    </Text>
                  )}
                </Box>
              </Box>

              {/* Mini Map */}
              <PartnerMiniMap partner={partner} boundaries={boundaries} />

              {/* Stats */}
              {partner.status !== "waitlisted" && (
                <Group grow gap={8} align="stretch">
                  <Box
                    style={{
                      background: "#edf1f8",
                      border: "1px solid #c5d2e9",
                      borderLeft: "4px solid #1B3668",
                      borderRadius: 10,
                      padding: "10px 12px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Group gap={5} align="flex-start" style={{ minHeight: 44 }}>
                      <IconBabyCarriage size={12} color="#1B3668" style={{ marginTop: 1, flexShrink: 0 }} />
                      <Text fz="9px" c="#1B3668" tt="uppercase" fw={800} lts="0.08em">
                        Approx. Number of Babies Helped
                      </Text>
                    </Group>
                    <Box style={{ paddingTop: 4 }}>
                      <Text fz="24px" fw={900} c="#1B3668" lh={1}>
                        {partner.number_babies_helped != null ? partner.number_babies_helped.toLocaleString() : "N/A"}
                      </Text>
                      <Text fz="10px" c="#2471A3" fw={500} mt={2}>
                        Per Month
                      </Text>
                    </Box>
                  </Box>
                  <Box
                    style={{
                      background: "#e0e8f5",
                      border: "1px solid #c5d2e9",
                      borderLeft: "4px solid #2471A3",
                      borderRadius: 10,
                      padding: "10px 12px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Group gap={5} align="flex-start" style={{ minHeight: 44 }}>
                      <IconChartBar size={12} color="#2471A3" style={{ marginTop: 1, flexShrink: 0 }} />
                      <Text fz="9px" c="#162C58" tt="uppercase" fw={800} lts="0.08em">
                        Total Number of Diapers Distributed
                      </Text>
                    </Group>
                    <Box style={{ paddingTop: 4 }}>
                      <Text fz="24px" fw={900} c="#162C58" lh={1}>
                        {(partner.number_diapers || 0).toLocaleString()}
                      </Text>
                      <Text fz="10px" c="#2471A3" fw={500} mt={2}>
                        By Organization
                      </Text>
                    </Box>
                  </Box>
                </Group>
              )}

              {/* Details */}
              <Box
                style={{
                  border: "1px solid #E4ECF4",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <Box
                  style={{
                    background: "linear-gradient(90deg, #e0e8f5 0%, #edf1f8 100%)",
                    borderBottom: "1px solid #c5d2e9",
                    padding: "8px 12px",
                  }}
                >
                  <Group gap={7} align="center">
                    <ThemeIcon
                      size={22}
                      radius="xl"
                      styles={{ root: { backgroundColor: "#c5d2e9", color: "#1B3668" } }}
                    >
                      <IconUsersGroup size={12} />
                    </ThemeIcon>
                    <Text fz="11px" fw={800} c="#1B3668" tt="uppercase" lts="0.06em">
                      Details
                    </Text>
                  </Group>
                </Box>
                <Stack gap={0}>
                  <Group gap={10} p={12} align="flex-start">
                    <IconMapPin size={15} color="#2471A3" style={{ marginTop: 2, flexShrink: 0 }} />
                    <Stack gap={2}>
                      <Text fz="10px" fw={700} c="#667085" tt="uppercase" lts="0.06em">
                        Address
                      </Text>
                      <Text fz="13px" fw={500} c="#344054">
                        {partner.address || "Not provided"}
                      </Text>
                    </Stack>
                  </Group>
                  {partner.status === "active" && partner.startPartner && (
                    <>
                      <Divider color="#E4ECF4" />
                      <Group gap={10} p={12} align="flex-start">
                        <IconCalendar
                          size={15}
                          color="#2471A3"
                          style={{ marginTop: 2, flexShrink: 0 }}
                        />
                        <Stack gap={2}>
                          <Text fz="10px" fw={700} c="#667085" tt="uppercase" lts="0.06em">
                            Partner Since
                          </Text>
                          <Text fz="13px" fw={500} c="#344054">
                            {partner.startPartner.getFullYear()}
                          </Text>
                        </Stack>
                      </Group>
                    </>
                  )}
                </Stack>
              </Box>
            </Stack>
          )
        )}
      </Box>
    </Drawer>
  );
}
