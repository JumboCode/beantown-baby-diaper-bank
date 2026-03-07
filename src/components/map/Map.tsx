"use client";

import dynamic from "next/dynamic";
import { useLeafletMap } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
import { useEffect, useMemo, useRef, useState } from "react";
import type { City, Distribution, status } from "@/generated/prisma/client";
import {
  Popup,
  TileLayer,
  Polygon,
  MapContainer,
  Tooltip,
} from "react-leaflet";
import { LatLngExpression } from "leaflet";

import "leaflet/dist/leaflet.css";
import type { MapData } from "@/app/main/page";
import {
  Title,
  Text,
  Stack,
  Group,
  Avatar,
  Tooltip as MantineTooltip,
  Divider,
} from "@mantine/core";
import PartnerIconDrawer from "./PartnerIconDrawer";
import PartnerAvatar from "./PartnerAvatar";

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

const getColor = (value: number, max: number) => {
  if (value <= 0 || max <= 0) return LEVEL_COLORS[0];
  const ratio = Math.min(1, value / max);
  const stops = LEVEL_COLORS.length - 1;
  const scaled = ratio * stops;
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

type PartnerInfoType = {
  id: number;
  name: string;
  logo_url?: string | null; // Snake case used in Map.tsx
  logoUrl?: string | null; // Camel case used in route.ts API
  status?: string | null; // Can be "active", "waitlisted", etc.
  waitlisted?: boolean | string; // Can be true/false from DB
};

type CityMapInfo = City & {
  distributions: Distribution[];
  partners: PartnerInfoType[];
};

type MapTimelineSlider = {
  value: string | number;
};

// --- 3. Main HeatMap Component ---

export default function Map({ mapData, timelineSlider }: { mapData: MapData, timelineSlider: MapTimelineSlider }) {
  const { mapConfig } = useLeafletMap();
  const { style: mapStyle, ...mapOptions } = mapConfig;
  const { tileLayerProps } = useBaseTileLayer();
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(
    null,
  );

  const cities = useMemo(() => mapData?.cities.data ?? [], [mapData]);

  const boundaryPolygons = useMemo(() => {
    if (!mapData?.boundaries || cities.length === 0) return [];

    let maxDiapers = 0;
    const cityTotals: Record<string, number> = {};

    cities.forEach((city) => {
      const total = city.distributions.reduce(
        (sum, d) => sum + Number(d.numberDiapers),
        0,
      );
      if (city.name) cityTotals[city.name] = total;
      if (total > maxDiapers) maxDiapers = total;
    });

    return mapData.boundaries.features.map((feature) => {
      const name = feature.properties?.name;
      const total = name ? cityTotals[name] || 0 : 0;

      return {
        id: name || Math.random(),
        positions: feature.geometry
          .coordinates as unknown as LatLngExpression[][],
        name: name,
        fillColor: getColor(total, maxDiapers),
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
      <MapContainer {...mapOptions} style={mapStyle}>
        <TileLayer {...tileLayerProps} />
        {visibleBoundaries.map((boundary, index) => {
          const boundaryId = String(boundary.id || index);
          const isEntering = enteringBoundaryIds.has(boundaryId);

          return (
          <Polygon
            key={boundaryId}
            pathOptions={{
              className: isEntering
                ? "city-boundary city-boundary-enter"
                : "city-boundary",
              weight:
                activeId === boundary.id || hoveredId === boundary.id
                  ? 1.5
                  : 0.5,
                color:
                  activeId === boundary.id || hoveredId === boundary.id
                    ? "#0F4F78"
                    : "#5A7687",
                fillColor: boundary.fillColor,
                fillOpacity:
                  activeId === boundary.id
                    ? 0.65
                    : hoveredId === boundary.id
                      ? 0.5
                      : 0.35,
              }}
              positions={boundary.positions}
              eventHandlers={{
                mouseover: () => setHoveredId(boundary.id),
                mouseout: () =>
                  setHoveredId((current) =>
                    current === boundary.id ? null : current,
                  ),
                click: () => setActiveId(boundary.id),
                popupclose: () =>
                  setActiveId((current) =>
                    current === boundary.id ? null : current,
                  ),
              }}
            >
              {boundary.name && (
                <Tooltip sticky direction="top" offset={[0, -4]}>
                  <Text fw={700} fz="sm" c="#0F4F78">
                    {boundary.name}
                  </Text>
                </Tooltip>
              )}
              {boundary.name &&
                cities.map(
                  (city) =>
                    city.name === boundary.name && (
                      <PopupContent
                        key={city.id.toString()}
                        city={city}
                        timelineSlider={timelineSlider}
                        onPartnerSelect={setSelectedPartnerId}
                      />
                    ),
                )}
          </Polygon>
          );
        })}
      </MapContainer>

      <PartnerIconDrawer
        partnerId={selectedPartnerId}
        onClose={() => setSelectedPartnerId(null)}
      />

      <style jsx global>{`
        @keyframes cityBoundaryFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .city-boundary-enter {
          animation: cityBoundaryFadeIn 700ms ease-out;
        }

        .city-boundary {
          transition:
            fill 700ms ease-out,
            fill-opacity 700ms ease-out,
            stroke 700ms ease-out,
            stroke-opacity 700ms ease-out;
        }
      `}</style>
    </div>
  );
}

// --- 4. Popup Content (Condensed Styling) ---

function PopupContent({
  city,
  timelineSlider,
  onPartnerSelect,
}: {
  city: CityMapInfo;
  timelineSlider: MapTimelineSlider;
  onPartnerSelect: (id: number) => void;
}) {
  // ROBUST FILTER: Detects waitlisted by string or boolean
  const waitlistedPartners = city.partners.filter(
    (p) =>
      p.status === "waitlisted" ||
      p.waitlisted === true ||
      p.waitlisted === "true",
  );

  // ACTIVE FILTER: Everyone who isn't waitlisted or inactive
  const activePartners = city.partners.filter((p) => {
    const isWaitlisted =
      p.status === "waitlisted" ||
      p.waitlisted === true ||
      p.waitlisted === "true";
    const isInactive = p.status === "inactive";
    return !isWaitlisted && !isInactive;
  });

  const totalDiapers =
    city.distributions.reduce((sum, d) => sum + Number(d.numberDiapers), 0) ??
    0;
  return (
    <Popup minWidth={280}>
      <Stack gap="xs">
        <Title order={3} fz="18px" c="#101828">
          {city.name}
        </Title>

        <Stack gap={0}>
          <Text fz="14px" c="#344054">
            Total Diapers Distributed in {timelineSlider.value}: <b>{totalDiapers.toLocaleString()}</b>
          </Text>
        </Stack>

        {/* --- Active Partners --- */}
        <Divider my="xs" label="Active Partners" labelPosition="left" />
        <Group gap="xs" wrap="wrap">
          {activePartners.length > 0 ? (
            activePartners.map((p) => (
              <PartnerAvatar
                key={p.id}
                id={p.id}
                name={p.name}
                url={p.logoUrl || p.logo_url}
                status={p.status as status}
                onClick={() => onPartnerSelect(p.id)}
              />
            ))
          ) : (
            <Text fz="xs" c="dimmed" fs="italic">
              No active partners
            </Text>
          )}
        </Group>

        {/* --- Waitlisted Partners --- */}
        <Divider
          my="xs"
          label={`Waitlisted (${waitlistedPartners.length})`}
          labelPosition="left"
        />
        <Group gap="xs" wrap="wrap">
          {waitlistedPartners.length > 0 ? (
            waitlistedPartners.map((p) => (
              <MantineTooltip key={p.id} label={p.name} withArrow>
                <Avatar
                  src={p.logo_url || p.logoUrl}
                  size="sm"
                  radius="xl"
                  color="gray"
                  variant="outline"
                  style={{ opacity: 0.8, cursor: "pointer" }}
                >
                  {p.name.substring(0, 2).toUpperCase()}
                </Avatar>
              </MantineTooltip>
            ))
          ) : (
            <Text fz="xs" c="dimmed" fs="italic">
              No waitlisted partners found
            </Text>
          )}
        </Group>
      </Stack>
    </Popup>
  );
}
