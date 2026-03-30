"use client";

import dynamic from "next/dynamic";
import { useLeafletMap } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
import { useEffect, useMemo, useRef, useState } from "react";
import type { City, Distribution } from "@/generated/prisma/client";
import {
  TileLayer,
  Polygon,
  MapContainer,
  Tooltip,
} from "react-leaflet";
import { LatLngExpression } from "leaflet";

import "leaflet/dist/leaflet.css";
import type { MapData } from "@/app/page";
import {
  Title,
  Text,
  Stack,
  Group,
  Avatar,
  Tooltip as MantineTooltip,
  Box,
  Badge,
  ThemeIcon,
} from "@mantine/core";
import Image from "next/image";
import PartnerIconDrawer from "./PartnerIconDrawer";
import { IconMapPin, IconUsersGroup, IconX, IconChartBar, IconCalendarStats } from "@tabler/icons-react";

// --- 1. Helper Functions ---

const LEVEL_COLORS = ["#E8F4FF", "#B2E5FF", "#51A3CC", "#2C85B2"];

const hexToRgb = (hex: string): [number, number, number] => {
  const parsed = hex.replace("#", "");
  const bigint = parseInt(parsed, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

const componentToHex = (c: number) => {
  const clamped = Math.max(0, Math.min(255, c));
  const hex = clamped.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

function cityScore(value: number, median: number, p25: number, p75: number) {
  const iqr = Math.max(p75 - p25, 1);
  const k = 4 / iqr;
  return clamp01(sigmoid(k * (value - median)));
}

const getScoreColor = (score: number) => {
  const stops = LEVEL_COLORS.length - 1;
  const scaled = score * stops;
  const lower = Math.floor(scaled);
  const upper = Math.min(stops, Math.ceil(scaled));
  const t = scaled - lower;

  const [r1, g1, b1] = hexToRgb(LEVEL_COLORS[lower]);
  const [r2, g2, b2] = hexToRgb(LEVEL_COLORS[upper]);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return rgbToHex(r, g, b);
};

// --- 2. Types and Dynamic Imports ---

export const Marker = dynamic(
  () => import("react-leaflet").then((module) => module.Marker),
  { ssr: false },
);

export const ZoomControl = dynamic(
  () => import("react-leaflet").then((module) => module.ZoomControl),
  { ssr: false },
);

type PartnerInfoType = {
  id: number;
  name: string;
  logo_url?: string | null; // Snake case used in Map.tsx
  logoUrl?: string | null; // Camel case used in route.ts API
  status?: string | null; // Can be "active", "waitlisted", etc.
  waitlisted?: boolean | string; // Can be true/false from DB
  startPartner?: string | null;
};

type CityMapInfo = City & {
  distributions: Distribution[];
  partners: PartnerInfoType[];
  historicalStats?: { median: number; p25: number; p75: number } | null;
  runningTotal?: number;
};

type MapTimelineSlider = {
  value: string | number;
};

function useCountUp(target?: number, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target == null) {
      setValue(0);
      return;
    }

    const startValue = value;
    const delta = target - startValue;

    if (delta === 0) {
      return;
    }

    const startTime = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startValue + delta * eased));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [target, duration]);

  return value;
}

// --- 3. Main HeatMap Component ---

export default function Map({
  mapData,
  timelineSlider,
  totalDiapersForYear,
  yearlyDistributed,
  selectedYear,
}: {
  mapData: MapData;
  timelineSlider: MapTimelineSlider;
  totalDiapersForYear?: number;
  yearlyDistributed?: number;
  selectedYear?: string;
}) {
  const { mapConfig } = useLeafletMap();
  const { style: mapStyle, ...mapOptions } = mapConfig;
  const { tileLayerProps } = useBaseTileLayer();
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(
    null,
  );
  const [activeCityName, setActiveCityName] = useState<string | null>(null);
  const animatedRunningTotal = useCountUp(totalDiapersForYear, 1400);
  const animatedYearlyTotal = useCountUp(yearlyDistributed, 700);

  const cities = useMemo(() => mapData?.cities.data ?? [], [mapData]);

  const activeCity = useMemo(
    () => (activeCityName ? cities.find(c => c.name === activeCityName) ?? null : null),
    [activeCityName, cities],
  );

  const boundaryPolygons = useMemo(() => {
    if (!mapData?.boundaries || cities.length === 0) return [];

    const cityTotals: Record<string, number> = {};
    const cityStats: Record<string, { median: number; p25: number; p75: number } | null | undefined> = {};

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1–12
    const isCurrentYear = selectedYear === String(currentYear);

    cities.forEach((city) => {
      const total = city.distributions.reduce(
        (sum, d) => sum + Number(d.numberDiapers),
        0,
      );
      // Annualize the current year's total so it's comparable to historical
      // full-year values used in the quartile stats.
      const scoringTotal =
        isCurrentYear && currentMonth > 0
          ? (total / currentMonth) * 12
          : total;
      if (city.name) {
        cityTotals[city.name] = scoringTotal;
        cityStats[city.name] = city.historicalStats;
      }
    });

    return mapData.boundaries.features.map((feature) => {
      const name = feature.properties?.name;
      const total = name ? cityTotals[name] || 0 : 0;
      const stats = name ? cityStats[name] : null;

      let fillColor = "#E4E7EC"; // Gray for no data
      if (total > 0 && stats) {
        const score = cityScore(total, stats.median, stats.p25, stats.p75);
        fillColor = getScoreColor(score);
      } else if (total > 0 && !stats) {
        // Fallback for missing stats
        fillColor = LEVEL_COLORS[0];
      }

      return {
        id: name || Math.random(),
        positions: feature.geometry
          .coordinates as unknown as LatLngExpression[][],
        name: name,
        fillColor,
        totalDiapers: total,
      };
    });
  }, [mapData, cities]);

  const visibleBoundaries = useMemo(
    () => boundaryPolygons.filter((boundary) => boundary.totalDiapers > 0),
    [boundaryPolygons],
  );

  const previousVisibleIdsRef = useRef<Set<string>>(new Set());

  const enteringBoundaryIds = useMemo(() => {
    const previous = previousVisibleIdsRef.current;
    const entering = new Set<string>();

    visibleBoundaries.forEach((boundary, index) => {
      const boundaryId = String(boundary.id || index);
      if (!previous.has(boundaryId)) entering.add(boundaryId);
    });

    return entering;
  }, [visibleBoundaries]);

  useEffect(() => {
    previousVisibleIdsRef.current = new Set(
      visibleBoundaries.map((boundary, index) => String(boundary.id || index)),
    );
  }, [visibleBoundaries]);

  return (
    <div
      style={{ position: "relative", height: "100%", width: "100%", zIndex: 0 }}
    >
      <MapContainer {...mapOptions} zoomControl={false} style={mapStyle}>
        <ZoomControl position="bottomleft" />
        <TileLayer {...tileLayerProps} />
        {visibleBoundaries.map((boundary, index) => {
          const boundaryId = String(boundary.id || index);
          const isEntering = enteringBoundaryIds.has(boundaryId);

          return (
            <Polygon
              key={boundaryId}
              className={
                isEntering
                  ? "city-boundary city-boundary-enter"
                  : "city-boundary"
              }
              pathOptions={{
                weight:
                  activeId === boundary.id
                    ? 2
                    : hoveredId === boundary.id
                      ? 2.5
                      : 0.5,
                color:
                  activeId === boundary.id
                    ? "#0F4F78"
                    : hoveredId === boundary.id
                      ? "#F97316" // Vibrant orange
                      : "#5A7687",
                fillColor: boundary.fillColor,
                fillOpacity:
                  activeId === boundary.id
                    ? 0.75
                    : hoveredId === boundary.id
                      ? 0.65
                      : 0.35,
              }}
              positions={boundary.positions}
              eventHandlers={{
                mouseover: () => setHoveredId(boundary.id),
                mouseout: () =>
                  setHoveredId((current) =>
                    current === boundary.id ? null : current,
                  ),
                click: () => {
                  setActiveCityName(prev => prev === boundary.name ? null : (boundary.name ?? null));
                  setActiveId(prev => prev === boundary.id ? null : boundary.id);
                },
              }}
            >
              {boundary.name && (() => {
                const city = cities.find(c => c.name === boundary.name);
                if (!city) {
                  return (
                    <Tooltip sticky direction="top" offset={[0, -4]}>
                      <Text fw={700} fz="sm" c="#0F4F78">
                        {boundary.name}
                      </Text>
                    </Tooltip>
                  );
                }

                const totalDiapers = city.distributions.reduce((sum, d) => sum + Number(d.numberDiapers), 0) ?? 0;

                const selectedYear = Number(timelineSlider.value);
                const activePartners = city.partners.filter((p) => {
                  const isWaitlisted = p.status === "waitlisted" || (p as any).waitlisted === true || (p as any).waitlisted === "true";
                  const isInactive = p.status === "inactive";
                  let startedOnOrBeforeYear = true;
                  if ((p as any).startPartner) {
                    startedOnOrBeforeYear = new Date((p as any).startPartner).getUTCFullYear() <= selectedYear;
                  }
                  return !isWaitlisted && !isInactive && startedOnOrBeforeYear;
                });

                return (
                  <Tooltip
                    sticky
                    direction="top"
                    offset={[0, -10]}
                    opacity={1}
                    className="custom-map-tooltip"
                  >
                    <Box
                      style={{
                        background: "rgba(255, 255, 255, 0.96)",
                        border: "1px solid #E4E7EC",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(16, 24, 40, 0.12)",
                        padding: "10px 14px",
                        backdropFilter: "blur(8px)",
                        minWidth: 160,
                        textAlign: "left",
                      }}
                    >
                      <Group gap={6} mb={4} wrap="nowrap">
                        <ThemeIcon size={20} radius="xl" variant="light" color="cyan" styles={{ root: { backgroundColor: "#E0F2FE", color: "#0F6B99" } }}>
                          <IconMapPin size={12} />
                        </ThemeIcon>
                        <Text fw={800} fz="15px" c="#101828" lh={1}>{boundary.name}</Text>
                      </Group>

                      {totalDiapers === 0 ? (
                        <Text fz="12px" c="#667085" fw={500} mt={6}>
                          0 diapers distributed this year
                        </Text>
                      ) : (
                        <Stack gap={4} mt={6}>
                          <Group justify="space-between" wrap="nowrap">
                            <Text fz="11px" fw={700} c="#475467" tt="uppercase">in {String(timelineSlider.value)}</Text>
                            <Text fz="13px" fw={800} c="#16A34A">+{totalDiapers.toLocaleString()}</Text>
                          </Group>
                          <Group justify="space-between" wrap="nowrap">
                            <Text fz="11px" fw={700} c="#475467" tt="uppercase">Total</Text>
                            <Text fz="13px" fw={800} c="#0F6B99">{city.runningTotal?.toLocaleString() ?? 0}</Text>
                          </Group>
                          <Group justify="space-between" wrap="nowrap" mt={2}>
                            <Text fz="11px" fw={700} c="#475467" tt="uppercase">Partner Orgs</Text>
                            <Badge variant="light" color="blue" size="sm" radius="xl" fw={700}>
                              {activePartners.length}
                            </Badge>
                          </Group>
                        </Stack>
                      )}
                    </Box>
                  </Tooltip>
                );
              })()}
            </Polygon>
          );
        })}
      </MapContainer>

      <Box
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 1000,
          pointerEvents: "none",
          minWidth: 240,
          background: "#053766",
          borderRadius: 14,
          boxShadow: "0 8px 32px rgba(5, 55, 102, 0.4)",
          padding: "14px 18px",
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={4}>
            <Text fz="10px" fw={700} c="rgba(255,255,255,0.55)" tt="uppercase" lts="0.1em">
              Total Diapers Distributed{selectedYear ? ` Through ${selectedYear}` : ""}
            </Text>
            <Text fz="40px" fw={900} c="white" lh={1}>
              {totalDiapersForYear != null
                ? animatedRunningTotal.toLocaleString()
                : "--"}
            </Text>
          </Stack>
          <Image
            src="/diaper.svg"
            alt="Diaper icon"
            width={52}
            height={42}
            style={{ filter: "brightness(0) invert(1)", opacity: 0.7, flexShrink: 0, marginTop: 2 }}
          />
        </Group>
      </Box>

      <PartnerIconDrawer
        partnerId={selectedPartnerId}
        onClose={() => setSelectedPartnerId(null)}
      />

      {activeCity && (
        <Box
          style={{
            position: "absolute",
            top: 110,
            right: 16,
            zIndex: 1000,
            width: 350,
            maxHeight: "calc(100% - 190px)",
            overflowY: "auto",
            background: "rgba(255, 255, 255, 0.97)",
            border: "1px solid #E4E7EC",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(16, 24, 40, 0.12)",
            backdropFilter: "blur(8px)",
          }}
        >
          <PopupContent
            city={activeCity}
            timelineSlider={timelineSlider}
            onPartnerSelect={setSelectedPartnerId}
            onClose={() => { setActiveCityName(null); setActiveId(null); }}
          />
        </Box>
      )}

      <Box
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 1000,
          pointerEvents: "none",
          background: "rgba(255, 255, 255, 0.96)",
          border: "1px solid #E4E7EC",
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(16, 24, 40, 0.12)",
          padding: "12px 14px",
          backdropFilter: "blur(8px)",
          minWidth: 220,
          maxWidth: 280,
        }}
      >
        <Text fz="11px" fw={800} c="#475467" tt="uppercase" mb={8} lts="0.05em">
          Relative Distribution Volume
        </Text>
        <Box
          style={{
            height: 8,
            borderRadius: 4,
            width: "100%",
            background: `linear-gradient(to right, ${LEVEL_COLORS.join(", ")})`,
            marginBottom: 6,
          }}
        />
        <Group justify="space-between">
          <Text fz="10px" fw={700} c="#667085" tt="uppercase">Below Avg</Text>
          <Text fz="10px" fw={700} c="#667085" tt="uppercase">Above Avg</Text>
        </Group>
      </Box>

    </div>
  );
}

// --- 4. City Side Panel ---

function PopupContent({
  city,
  timelineSlider,
  onPartnerSelect,
  onClose,
}: {
  city: CityMapInfo;
  timelineSlider: MapTimelineSlider;
  onPartnerSelect: (id: number) => void;
  onClose: () => void;
}) {
  const [showAllWaitlisted, setShowAllWaitlisted] = useState(false);
  // ROBUST FILTER: Detects waitlisted by string or boolean
  const waitlistedPartners = city.partners.filter(
    (p) =>
      p.status === "waitlisted" ||
      p.waitlisted === true ||
      p.waitlisted === "true",
  );

  // ACTIVE FILTER: Everyone who isn't waitlisted or inactive, AND started on or before the current selected year
  const activePartners = city.partners.filter((p) => {
    const isWaitlisted =
      p.status === "waitlisted" ||
      p.waitlisted === true ||
      p.waitlisted === "true";
    const isInactive = p.status === "inactive";

    // Check start year
    const selectedYear = Number(timelineSlider.value);
    let startedOnOrBeforeYear = true;
    if (p.startPartner) {
      const partnerStartYear = new Date(p.startPartner).getUTCFullYear();
      startedOnOrBeforeYear = partnerStartYear <= selectedYear;
    }

    return !isWaitlisted && !isInactive && startedOnOrBeforeYear;
  });

  const totalDiapers =
    city.distributions.reduce((sum, d) => sum + Number(d.numberDiapers), 0) ??
    0;
  const totalChildren =
    city.distributions.reduce((sum, d) => sum + Number(d.numberChildren), 0) ??
    0;
  const visibleWaitlistedPartners = showAllWaitlisted
    ? waitlistedPartners
    : waitlistedPartners.slice(0, 5);
  const hasMoreWaitlistedPartners = waitlistedPartners.length > 5;

  return (
    <>
      {/* Gradient header banner */}
      <Box
        style={{
          background: "linear-gradient(135deg, #053766 0%, #1e3a5f 55%, #2c85b2 100%)",
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
              <IconMapPin size={15} color="rgba(255,255,255,0.75)" />
              <Title order={3} fz="20px" fw={800} c="white" lh={1}>
                {city.name}
              </Title>
            </Group>
            <Text fz="11px" c="rgba(255,255,255,0.6)" fw={500} ml={23}>
              Partner snapshot · {timelineSlider.value}
            </Text>
          </Stack>
          <Group gap={8} wrap="nowrap" align="center" mt={2}>
            <Badge
              radius="xl"
              fw={700}
              size="sm"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                backdropFilter: "blur(4px)",
              }}
            >
              {timelineSlider.value}
            </Badge>
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
              background: "#f0f6ff",
              border: "1px solid #c3d9f7",
              borderLeft: "4px solid #053766",
              borderRadius: 10,
              padding: "10px 12px",
            }}
          >
            <Group gap={5} mb={4} align="center">
              <IconChartBar size={12} color="#053766" />
              <Text fz="9px" c="#053766" tt="uppercase" fw={800} lts="0.08em">
                Lifetime Total
              </Text>
            </Group>
            <Text fz="24px" fw={900} c="#053766" lh={1}>
              {city.runningTotal?.toLocaleString() ?? 0}
            </Text>
            <Text fz="10px" c="#2c85b2" fw={500} mt={2}>diapers distributed</Text>
          </Box>
          <Box
            style={{
              background: "#e4effe",
              border: "1px solid #c3d9f7",
              borderLeft: "4px solid #2c85b2",
              borderRadius: 10,
              padding: "10px 12px",
            }}
          >
            <Group gap={5} mb={4} align="center">
              <IconCalendarStats size={12} color="#2c85b2" />
              <Text fz="9px" c="#1e3a5f" tt="uppercase" fw={800} lts="0.08em">
                {timelineSlider.value} YTD
              </Text>
            </Group>
            <Text fz="24px" fw={900} c="#1e3a5f" lh={1}>
              +{totalDiapers.toLocaleString()}
            </Text>
            <Text fz="10px" c="#2c85b2" fw={500} mt={2}>this year</Text>
            {totalChildren > 0 && (
              <Text fz="10px" c="#1e3a5f" fw={600} mt={3}>
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
              background: "linear-gradient(90deg, #e4effe 0%, #f0f6ff 100%)",
              borderBottom: activePartners.length > 0 ? "1px solid #c3d9f7" : undefined,
              padding: "8px 12px",
            }}
          >
            <Group justify="space-between" align="center">
              <Group gap={7} align="center">
                <ThemeIcon
                  size={22}
                  radius="xl"
                  styles={{ root: { backgroundColor: "#c3d9f7", color: "#053766" } }}
                >
                  <IconUsersGroup size={12} />
                </ThemeIcon>
                <Text fz="11px" fw={800} c="#053766" tt="uppercase" lts="0.06em">
                  Partner Organizations
                </Text>
              </Group>
              <Badge
                variant="filled"
                radius="xl"
                fw={700}
                size="sm"
                styles={{ root: { background: "#053766" } }}
              >
                {activePartners.length}
              </Badge>
            </Group>
          </Box>

          <Box p={10}>
            {activePartners.length > 0 ? (
              <Stack gap={6}>
                {activePartners.map((p) => {
                  const selectedYear = Number(timelineSlider.value);
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
                      onClick={() => onPartnerSelect(p.id)}
                      style={{
                        cursor: "pointer",
                        padding: "5px 8px",
                        borderRadius: 8,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f0f6ff")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <Avatar
                        src={p.logoUrl || p.logo_url}
                        size="sm"
                        radius="xl"
                        color="blue"
                        variant="light"
                        style={{ flexShrink: 0 }}
                      >
                        {p.name.substring(0, 2).toUpperCase()}
                      </Avatar>
                      <Text fz="13px" fw={600} c="#1e3a5f" style={{ flex: 1, minWidth: 0 }} truncate>
                        {p.name}
                      </Text>
                      {isNew && (
                        <Badge size="xs" variant="filled" color="red" style={{ fontSize: "8px", flexShrink: 0 }}>
                          NEW
                        </Badge>
                      )}
                    </Group>
                  );
                })}
              </Stack>
            ) : (
              <Text fz="xs" c="dimmed" fs="italic">No active partners</Text>
            )}
          </Box>
        </Box>

        {/* Waitlisted */}
        {waitlistedPartners.length > 0 && (
          <Box
            style={{
              border: "1px solid #EAECF0",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <Box
              style={{
                background: "#f5f8ff",
                borderBottom: "1px solid #c3d9f7",
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
                    >
                      <Text truncate fz="11px">{p.name}</Text>
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
