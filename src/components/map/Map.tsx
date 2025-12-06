"use client";

import dynamic from "next/dynamic";
import { useLeafletMap } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
import { act, useMemo, useState } from "react";
import type { City, Distribution } from "@/generated/prisma/client";
import { Popup, TileLayer, Polygon, MapContainer } from "react-leaflet";
import { LatLngExpression } from "leaflet";

import "leaflet/dist/leaflet.css";
import type { MapData } from "@/app/main/page";
import PartnerInfo from "@/app/epic2sprint1/partnerInfo";
import { Title, Text, Stack } from "@mantine/core";

// Dynamically import react-leaflet components with SSR disabled
// because they depend on the browser environment (e.g., window, document).

// Lightest -> darkest for linear interpolation
const LEVEL_COLORS = ["#E8F4FF", "#B2E5FF", "#51A3CC", "#2C85B2"];
// Linearly interpolate between colors in LEVEL_COLORS based on value/max
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

export const Marker = dynamic(
  () => import("react-leaflet").then((module) => module.Marker),
  { ssr: false },
);

type Coordinates = {
  cityId: number;
  cityName: string;
  lat: number;
  lng: number;
};

type PartnerInfoType = {
  id: number;
  name: string;
  logo_url?: string | null;
};

type CityMapInfo = City & {
  distributions: Distribution[];
  partners: PartnerInfoType[];
};

export default function LeafletMap({ mapData }: { mapData: MapData }) {
  const { mapConfig } = useLeafletMap();
  const { style: mapStyle, ...mapOptions } = mapConfig;
  const { tileLayerProps } = useBaseTileLayer();
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const [activeId, setActiveId] = useState<string | number | null>(null);

  const cities = mapData?.cities.data;
  console.log("Cities data:", cities);

  const boundaryPolygons = useMemo(() => {
    if (!mapData?.boundaries) return [];

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
      // Look up the total using the name, default to 0
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

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        zIndex: 0,
      }}
    >
      <MapContainer {...mapOptions} style={mapStyle}>
        <TileLayer {...tileLayerProps} />
        {boundaryPolygons.map((boundary, index) => (
          <Polygon
            key={boundary.id || index}
            pathOptions={{
              // stroke: false,
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
            {boundary.name &&
              cities.map(
                (city) =>
                  city.name === boundary.name && (
                    <PopupContent
                      key={city.id.toString()}
                      boundaryName={boundary.name!}
                      city={city}
                    />
                  ),
              )}
          </Polygon>
        ))}
      </MapContainer>
    </div>
  );
}

function PopupContent({ city }: { city: CityMapInfo }) {
  console.log("Popup for city:", city);
  const partners = city.partners;
  const totalDiapers =
    city.distributions.reduce((sum, d) => sum + Number(d.numberDiapers), 0) ??
    0;
  const totalChildren =
    city.distributions.reduce((sum, d) => sum + Number(d.numberChildren), 0) ??
    0;
  return (
    <Popup minWidth={280}>
      <div>
        <Title order={3} fz="18px" c="#101828">
          {city.name}
        </Title>
        <Text fz="16px" c="#344054">
          {" "}
          Diapers Distributed: {totalDiapers.toString()}{" "}
        </Text>
        <Text fz="16px" c="#344054">
          {" "}
          Children helped: {totalChildren.toString()}{" "}
        </Text>
        <Title order={4} fz="18px" style={{ marginTop: "10px" }}>
          Partner Information
        </Title>
        <Stack gap="sm">
          {partners.map((partner) => (
            <PartnerInfo
              key={partner.id.toString()}
              name={partner.name}
              url={partner.logo_url || null}
              id={partner.id}
              fromMarker={false}
            />
          ))}
        </Stack>
      </div>
    </Popup>
  );
}
