"use client";

import { useEffect, useState } from "react";
// Fixed Absolute Imports
import { useLeafletMap } from "@/components/map/useLeafletMap";
import { useBaseTileLayer } from "@/components/map/useBaseTileLayer";
import { Box, Title, Loader, Center, Stack, Text, Divider, Group, Paper } from "@mantine/core";

import dynamic from "next/dynamic";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), {
  ssr: false,
  loading: () => (
    <Center h={600}>
      <Loader color="#51A3CC" size="xl" />
    </Center>
  ),
});
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
const createPartnerIcon = (leaflet: typeof import("leaflet"), url: string | null) => {
  // Fallback to a clear placeholder if URL is missing to avoid white circles
  const validUrl = url && url.trim() !== "" ? url : "https://placehold.co/400x400?text=Logo";

  return leaflet.divIcon({
    className: "custom-partner-icon",
    html: `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-image: url('${validUrl}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        border: 2px solid #51A3CC;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        background-color: white;
      "></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export default function PartnerMap() {
  const { mapConfig } = useLeafletMap();
  const mapOptions = mapConfig;
  const { tileLayerProps } = useBaseTileLayer();

  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    import("leaflet").then((module) => {
      setLeaflet(module);
    });
  }, []);

  useEffect(() => {
    fetch("/api/partners")
      .then((res) => res.json())
      .then((data) => {
        // API returns data in 'data' field; ensure we check for coords
        const withCoords = (data.data || []).filter(
          (p: any) => p.coords && typeof p.coords.lat === "number",
        );
        setPartners(withCoords);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <Center h={600}>
        <Loader color="#51A3CC" size="xl" />
      </Center>
    );

  return (
    <Stack gap="md" m="xl">
      <Box>
        <Title order={2} c="#053766" fw={700}>
          Partner Locations
        </Title>
        <Text size="sm" c="dimmed">
          Distribution of partners matching original heatmap style
        </Text>
      </Box>

      <Paper
        withBorder
        radius="md"
        p={0}
        style={{ overflow: "hidden", height: "600px", zIndex: 0 }}
      >
        <MapContainer {...mapOptions} style={{ height: "100%", width: "100%" }}>
          <TileLayer {...tileLayerProps} />

          {leaflet &&
            partners.map((p) => (
              <Marker
                key={p.id}
                position={[p.coords.lat, p.coords.lng]}
                // Try both possible naming conventions for the logo
                icon={createPartnerIcon(leaflet, p.logoUrl || p.logoUrl)}
              >
                <Popup>
                  <Stack gap={4} align="center">
                    <Text fw={700} size="sm">
                      {p.name}
                    </Text>
                    <Text size="xs" c="dimmed" ta="center">
                      {p.address}
                    </Text>
                  </Stack>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </Paper>

      {/* Footer Legend */}
      <Box>
        <Divider
          my="xs"
          label={<Text fw={600}>Active Mapped Partners ({partners.length})</Text>}
          labelPosition="left"
        />
        <Group gap="sm" mt="sm">
          {partners.map((p) => (
            <Box
              key={p.id}
              style={{
                width: 35,
                height: 35,
                borderRadius: "50%",
                border: "1px solid #eee",
                backgroundImage: `url(${p.logoUrl})`,
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundColor: "white",
              }}
            />
          ))}
        </Group>
      </Box>
    </Stack>
  );
}
