import { Box, Skeleton } from "@mantine/core";
import { useLeafletMap } from "./useLeafletMap";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MapContainer = dynamic(
    () => import("react-leaflet").then((module) => module.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((module) => module.TileLayer),
    { ssr: false }
);

export default function MapSkeleton() {
    const { mapConfig } = useLeafletMap();
    const { style: mapStyle, ...mapOptions } = mapConfig;

    // We only mount the map on the client to avoid Leaflet SSR window errors
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <Skeleton h="100%" w="100%" radius="md" />;
    }

    return (
        <Box h="100%" w="100%" pos="relative" style={{ borderRadius: "8px", overflow: "hidden" }}>
            {/* Grey overlay that Pulses to simulate loading */}
            <Box
                pos="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                style={{
                    zIndex: 400, // Above map, below other controls
                    backgroundColor: "rgba(230, 235, 240, 0.6)",
                    animation: "pulse 1.5s infinite ease-in-out",
                    pointerEvents: "none",
                }}
            />

            {/* Underlying raw map without any polygons data */}
            <MapContainer
                {...mapOptions}
                style={{ ...mapStyle, filter: "grayscale(100%) opacity(0.5)" }}
                zoomControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
            </MapContainer>

            <style jsx global>{`
        @keyframes pulse {
          0% {
            background-color: rgba(230, 235, 240, 0.5);
          }
          50% {
            background-color: rgba(230, 235, 240, 0.8);
          }
          100% {
            background-color: rgba(230, 235, 240, 0.5);
          }
        }
      `}</style>
        </Box>
    );
}
