import { GeoJsonBoundaries } from "@/lib/types";
import { geoJsonToRingPositions } from "@/lib/util";
import { Center, Group, Text, Loader, Box } from "@mantine/core";
import { useState, useEffect } from "react";
import { useBaseTileLayer } from "./useBaseTileLayer";
import { useLeafletMap } from "./useLeafletMap";
import { PartnerWithStats } from "./PartnerDrawer";
import dynamic from "next/dynamic";

const MapContainer = dynamic(() => import("react-leaflet").then((module) => module.MapContainer), {
  ssr: false,
  loading: () => (
    <Center h={180}>
      <Loader color="#51A3CC" size="sm" />
    </Center>
  ),
});
const TileLayer = dynamic(() => import("react-leaflet").then((module) => module.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import("react-leaflet").then((module) => module.Marker), {
  ssr: false,
});
const Polygon = dynamic(() => import("react-leaflet").then((module) => module.Polygon), {
  ssr: false,
});

const infoCardStyle = {
  border: "1px solid #F2F4F7",
  borderRadius: 12,
  padding: "1rem 1.25rem",
  background: "#FFFFFF",
  boxShadow: "0 12px 30px rgba(52, 64, 84, 0.08)",
};

const infoLabelStyle = {
  fontSize: "0.85rem",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  fontWeight: 700,
};

function createPartnerIcon(
  leaflet: typeof import("leaflet"),
  url: string | null,
  partner: PartnerWithStats,
) {
  const initials = (partner.name ?? "PN").substring(0, 2).toUpperCase();
  const validUrl = url && url.trim() !== "" ? url : `https://placehold.co/400x400?text=${initials}`;

  return leaflet.divIcon({
    className: "custom-partner-icon",
    html: `
      <div style="
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background-image: url('${validUrl}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        border: 2px solid #51A3CC;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        background-color: white;
      "></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export function PartnerMiniMap({
  partner,
  boundaries,
}: {
  partner: PartnerWithStats;
  boundaries: GeoJsonBoundaries;
}) {
  const coords = partner.coords ?? partner.coordinates ?? null;
  const { tileLayerProps } = useBaseTileLayer();
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);
  const { mapConfig } = useLeafletMap();

  useEffect(() => {
    import("leaflet").then((module) => {
      setLeaflet(module);
    });
  }, []);
  const filteredBoundaires = (boundaries.features ?? []).filter((f) => {
    const id = f.id;
    return id && partner.citiesServed.includes(String(id));
  });
  const servedBoundaries = filteredBoundaires.map((f) => ({
    id: f.properties?.name ?? Math.random(),
    positions: geoJsonToRingPositions(f.geometry, f.properties?.name),
  }));

  if (!coords) {
    return null;
  }

  return (
    <div style={infoCardStyle}>
      <Group justify="space-between">
        <Text style={infoLabelStyle}>Location</Text>
        {/*legend */}
        <Group gap={6}>
          <Box
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#2C85B2",
            }}
          />
          <Text size="xs" c="dimmed" fw={500}>
            Served Area
          </Text>
        </Group>
      </Group>
      <div
        style={{
          marginTop: "0.75rem",
          height: 180,
          overflow: "hidden",
          borderRadius: 12,
          border: "1px solid #E5E7EB",
        }}
      >
        {leaflet ? (
          <MapContainer
            {...mapConfig}
            center={[coords.lat, coords.lng]}
            zoom={9}
            minZoom={9}
            zoomControl={false}
            attributionControl={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer {...tileLayerProps} />
            {servedBoundaries.map((boundary) => (
              <Polygon
                key={String(boundary.id)}
                positions={boundary.positions}
                pathOptions={{
                  color: "#1B3668",
                  weight: 0.5,
                  fillColor: "#1B3668",
                  fillOpacity: 0.35,
                }}
              />
            ))}
            <Marker
              position={[coords.lat, coords.lng]}
              icon={createPartnerIcon(leaflet, partner.logoUrl, partner)}
            />
          </MapContainer>
        ) : (
          <Center h="100%">
            <Loader color="#003263" size="sm" />
          </Center>
        )}
      </div>
    </div>
  );
}
