import {
  Stack,
  Title,
  ThemeIcon,
  Avatar,
  Group,
  Text,
  Badge,
  Box,
  Tooltip as MantineTooltip,
} from "@mantine/core";
import {
  IconMapPin,
  IconX,
  IconChartBar,
  IconCalendarStats,
  IconUsersGroup,
} from "@tabler/icons-react";
import { useState } from "react";
import { CityWithStats } from "@/lib/types";
import { Partner } from "@/generated/prisma/browser";

export interface CityPopupProps {
  city: CityWithStats;
  year: string;
  onPartnerSelect: (id: number) => void;
  onClose: () => void;
}

function isActivePartner(partner: Partner, year: string): boolean {
  const isWaitlisted = partner.status === "waitlisted";
  const isInactive = partner.status === "inactive";
  const selectedYear = Number(year);
  let startedOnOrBeforeYear = true;
  if (partner.startPartner) {
    const partnerStartYear = new Date(partner.startPartner).getUTCFullYear();
    startedOnOrBeforeYear = partnerStartYear <= selectedYear;
  }

  return !isWaitlisted && !isInactive && startedOnOrBeforeYear;
}

export function CityPopup({ city, year, onPartnerSelect, onClose }: CityPopupProps) {
  const [showAllWaitlisted, setShowAllWaitlisted] = useState(false);

  const waitlistedPartners = city.partners.filter((p) => p.status === "waitlisted");
  const activePartners = city.partners.filter((p) => isActivePartner(p, year));

  const totalDiapers = city.distributions.reduce((sum, d) => sum + Number(d.numberDiapers), 0) ?? 0;
  const totalChildren =
    city.distributions.reduce((sum, d) => sum + Number(d.numberChildren), 0) ?? 0;
  const visibleWaitlistedPartners = showAllWaitlisted
    ? waitlistedPartners
    : waitlistedPartners.slice(0, 5);
  const hasMoreWaitlistedPartners = waitlistedPartners.length > 5;

  return (
    <>
      {/* Gradient header banner */}
      <Box
        style={{
          background: "#1B3668",
          borderRadius: "12px 12px 0 0",
          padding: "16px 16px 14px",
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={3}>
            <Group gap={8} wrap="nowrap" align="center">
              <IconMapPin size={15} color="white" />
              <Title order={3} fz="20px" fw={800} c="white" lh={1}>
                {city.name}
              </Title>
            </Group>
            <Text fz="11px" c="white" fw={500} ml={23}>
              Partner snapshot · {year}
            </Text>
          </Stack>
          <Group gap={8} wrap="nowrap" align="center" mt={2}>
            <Badge
              radius="xl"
              fw={700}
              size="md"
              c="var(--color-brand-red)"
              variant="outline"
              // bg="white"
              // style={{
              //   background: "rgba(255,255,255,0.15)",
              //   color: "white",
              //   border: "1px solid rgba(255,255,255,0.3)",
              //   backdropFilter: "blur(4px)",
              // }}
            >
              {year}
            </Badge>
            <Box
              component="button"
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                cursor: "pointer",
                padding: "3px 4px",
                color: "rgba(255,255,255,0.8)",
                display: "flex",
                alignItems: "center",
                lineHeight: 0,
              }}
            >
              <IconX size={13} />
            </Box>
          </Group>
        </Group>
      </Box>

      {/* Stats + partners body */}
      <Stack gap={10} p={14}>
        {/* Two stat cells */}
        <Group grow gap={8}>
          <Box
            style={{
              background: "#edf1f8",
              border: "1px solid #c5d2e9",
              borderLeft: "4px solid #1B3668",
              borderRadius: 12,
              padding: "10px 12px",
            }}
          >
            <Group gap={5} mb={4} align="center">
              <IconChartBar size={12} color="#1B3668" />
              <Text fz="9px" c="#1B3668" tt="uppercase" fw={800} lts="0.08em">
                Lifetime Total
              </Text>
            </Group>
            <Text fz="24px" fw={900} c="#1B3668" lh={1}>
              {city.stats.runningTotal?.toLocaleString() ?? 0}
            </Text>
            <Text fz="10px" c="#2471A3" fw={500} mt={2}>
              diapers distributed
            </Text>
          </Box>
          <Box
            style={{
              background: "#e0e8f5",
              border: "1px solid #c5d2e9",
              borderLeft: "4px solid #2471A3",
              borderRadius: 12,
              padding: "10px 12px",
            }}
          >
            <Group gap={5} mb={4} align="center">
              <IconCalendarStats size={12} color="#2471A3" />
              <Text fz="9px" c="#162C58" tt="uppercase" fw={800} lts="0.08em">
                {year} YTD
              </Text>
            </Group>
            <Text fz="24px" fw={900} c="#162C58" lh={1}>
              +{totalDiapers.toLocaleString()}
            </Text>
            <Text fz="10px" c="#2471A3" fw={500} mt={2}>
              this year
            </Text>
            {totalChildren > 0 && (
              <Text fz="10px" c="#162C58" fw={600} mt={3}>
                {totalChildren.toLocaleString()} children helped
              </Text>
            )}
          </Box>
        </Group>

        {/* Partners */}
        <Box
          style={{
            border: "1px solid #E4ECF4",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <Box
            style={{
              background: "#edf1f8",
              borderBottom: activePartners.length > 0 ? "1px solid #c5d2e9" : undefined,
              padding: "8px 12px",
            }}
          >
            <Group justify="space-between" align="center">
              <Group gap={7} align="center">
                <ThemeIcon
                  size={22}
                  radius="xl"
                  styles={{ root: { backgroundColor: "#c5d2e9", color: "#1B3668" } }}
                >
                  <IconUsersGroup size={12} />
                </ThemeIcon>
                <Text fz="11px" fw={800} c="#1B3668" tt="uppercase" lts="0.06em">
                  Partner Organizations
                </Text>
              </Group>
              <Badge
                variant="filled"
                radius="xl"
                fw={700}
                size="sm"
                styles={{ root: { background: "#1B3668" } }}
              >
                {activePartners.length}
              </Badge>
            </Group>
          </Box>

          <Box p={10}>
            {activePartners.length > 0 ? (
              <Stack gap={6}>
                {activePartners.map((p) => {
                  console.log(p);
                  const selectedYear = Number(year);
                  let isNew = false;
                  if (p.startPartner) {
                    const partnerStartYear = new Date(p.startPartner).getUTCFullYear();
                    isNew = partnerStartYear === selectedYear;
                  }
                  return (
                    <Group
                      key={p.id}
                      gap={10}
                      align="center"
                      wrap="nowrap"
                      onClick={() => onPartnerSelect(Number(p.id))}
                      style={{
                        cursor: "pointer",
                        padding: "5px 8px",
                        borderRadius: 8,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#edf1f8")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Avatar
                        src={p.logoUrl}
                        size="sm"
                        radius="xl"
                        color="blue"
                        variant="light"
                        style={{ flexShrink: 0 }}
                      >
                        {p.name?.substring(0, 2).toUpperCase()}
                      </Avatar>
                      <Text
                        fz="13px"
                        fw={600}
                        c="#162C58"
                        style={{ flex: 1, minWidth: 0 }}
                        truncate
                      >
                        {p.name}
                      </Text>
                      {isNew && (
                        <Badge
                          size="xs"
                          variant="filled"
                          color="red"
                          style={{ fontSize: "8px", flexShrink: 0 }}
                        >
                          NEW
                        </Badge>
                      )}
                    </Group>
                  );
                })}
              </Stack>
            ) : (
              <Text fz="xs" c="dimmed" fs="italic">
                No active partners
              </Text>
            )}
          </Box>
        </Box>

        {/* Waitlisted */}
        {waitlistedPartners.length > 0 && (
          <Box
            style={{
              border: "1px solid #EAECF0",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <Box
              style={{
                background: "#f5f8ff",
                borderBottom: "1px solid #c5d2e9",
                padding: "8px 12px",
              }}
            >
              <Group justify="space-between" align="center">
                <Text fz="11px" fw={800} c="#667085" tt="uppercase" lts="0.06em">
                  Waitlisted
                </Text>
                <Badge variant="dot" color="gray" radius="xl" fw={700} size="sm">
                  {waitlistedPartners.length}
                </Badge>
              </Group>
            </Box>
            <Box p={10}>
              <Group gap={6} wrap="wrap">
                {visibleWaitlistedPartners.map((p) => (
                  <MantineTooltip key={p.id} label={p.name} withArrow>
                    <Badge
                      variant="outline"
                      color="gray"
                      radius="xl"
                      size="sm"
                      fw={500}
                      style={{ cursor: "default", maxWidth: 160 }}
                      onClick={() => onPartnerSelect(Number(p.id))}
                    >
                      <Text truncate fz="11px">
                        {p.name}
                      </Text>
                    </Badge>
                  </MantineTooltip>
                ))}
                {hasMoreWaitlistedPartners && !showAllWaitlisted && (
                  <Badge
                    component="button"
                    variant="light"
                    color="blue"
                    radius="xl"
                    size="sm"
                    fw={700}
                    style={{ cursor: "pointer", border: "none" }}
                    onClick={() => setShowAllWaitlisted(true)}
                  >
                    +{waitlistedPartners.length - visibleWaitlistedPartners.length} more
                  </Badge>
                )}
              </Group>
            </Box>
          </Box>
        )}
      </Stack>
    </>
  );
}
