"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, type ReactNode } from "react";
import { Loader } from "@mantine/core";
import { useLeafletMap } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
import {
  useRegionsLayer,
  type ChoroplethBucket,
} from "./useRegionsLayer";
import type { RegionsGeoJSON } from "@/lib/types";
import type * as Leaflet from "leaflet";

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
  onRegionHover?: (regionId?: string) => void;
  highlightedRegionId?: string | null;
  leftControls?: ReactNode;
  rightControls?: ReactNode;
  choroplethData?: Record<string, number>;
  choroplethBuckets?: ChoroplethBucket[];
};

export default function LeafletMap({
  regions,
  onRegionClick,
  onRegionHover,
  highlightedRegionId,
  leftControls,
  rightControls,
  choroplethData,
  choroplethBuckets,
}: LeafletMapProps) {
  const { mapConfig } = useLeafletMap();
  const { style: mapStyle, ...mapOptions } = mapConfig;
  const [mapInstance, setMapInstance] = useState<Leaflet.Map | null>(null);

  const normalizedRegions = useMemo<RegionsGeoJSON>(() => {
    if (!regions || Array.isArray(regions)) {
      return {
        type: "FeatureCollection",
        features: [],
      } as RegionsGeoJSON;
    }
    return regions;
  }, [regions]);

  const { tileLayerProps } = useBaseTileLayer();
  const { geoJsonProps } = useRegionsLayer({
    regions: normalizedRegions,
    onRegionClick,
    onRegionHover,
    highlightedRegionId,
    choroplethData,
    choroplethBuckets,
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
        style={mapStyle}
        whenReady={(event) => setMapInstance(event.target as Leaflet.Map)}>
        <TileLayer {...tileLayerProps} />
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
      {rightControls && (
        <div
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            zIndex: 1000,
            pointerEvents: "none",
            maxWidth: "min(320px, 90vw)",
          }}>
          <div style={{ pointerEvents: "auto" }}>{rightControls}</div>
        </div>
      )}
      {!mapInstance && <Loader />}
    </div>
  );
}
