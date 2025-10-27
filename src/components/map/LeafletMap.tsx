"use client";

import dynamic from "next/dynamic";
import { type ReactNode } from "react";
import { useLeafletMap } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
import { useRegionsLayer } from "./useRegionsLayer";
import type { RegionsGeoJSON } from "@/lib/types";

// Dynamically import react-leaflet components with SSR disabled
// because they depend on the browser environment (e.g., window, document).
const MapContainer = dynamic(
  () => import("react-leaflet").then((module) => module.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((module) => module.TileLayer),
  { ssr: false }
);

const GeoJSON = dynamic(
  () => import("react-leaflet").then((module) => module.GeoJSON),
  { ssr: false }
);

type LeafletMapProps = {
  regions: RegionsGeoJSON;
  onRegionClick: (regionId: string) => void;
  leftControls?: ReactNode;
};

export default function LeafletMap({
  regions,
  onRegionClick,
  leftControls,
}: LeafletMapProps) {
  // Use the custom hooks to get map configuration and layers
  const { mapConfig } = useLeafletMap();
  const { style: mapStyle, ...mapOptions } = mapConfig;

  // Normalize regions data to ensure it's a valid GeoJSON FeatureCollection
  // even if regions is null or an array
  // This prevents errors in the GeoJSON layer.
  const normalizedRegions: RegionsGeoJSON =
    !regions || Array.isArray(regions)
      ? {
          type: "FeatureCollection",
          features: [],
        }
      : regions;

  // Get the base tile layer props and regions layer props
  const { tileLayerProps } = useBaseTileLayer();
  const { geoJsonProps } = useRegionsLayer({
    regions: normalizedRegions,
    onRegionClick,
  });

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        zIndex: 0,
      }}>
      <MapContainer
        {...mapOptions}
        style={mapStyle}>
        {/* Base tile layer for the map */}
        <TileLayer {...tileLayerProps} />

        {/* Regions layer with click handling */}
        <GeoJSON {...geoJsonProps} />
      </MapContainer>
      {leftControls && (
        <div
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            zIndex: 1000,
            pointerEvents: "none",
            maxWidth: "min(320px, 90vw)",
          }}>
          <div style={{ pointerEvents: "auto" }}>{leftControls}</div>
        </div>
      )}
    </div>
  );
}
