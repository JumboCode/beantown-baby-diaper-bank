"use client";

import dynamic from "next/dynamic";
import { useMemo, type ReactNode } from "react";
import { useLeafletMap } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
import { useRegionsLayer, type ChoroplethBucket } from "./useRegionsLayer";
import type { PartnerSite, RegionsGeoJSON } from "@/lib/types";
import { PartnerMarker } from "./PartnerMarker";

// Dynamically import react-leaflet components with SSR disabled
// because they depend on the browser environment (e.g., window, document).

export const Marker = dynamic(
  () => import("react-leaflet").then((module) => module.Marker),
  { ssr: false }
);

export const Popup = dynamic(
  () => import("react-leaflet").then((module) => module.Popup),
  { ssr: false }
);

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
  partnerSites: PartnerSite[];
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
  partnerSites,
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

  // Normalize regions data to ensure it's a FeatureCollection

  const normalizedRegions = useMemo<RegionsGeoJSON>(() => {
    if (!regions || Array.isArray(regions)) {
      return {
        type: "FeatureCollection",
        features: [],
      } as RegionsGeoJSON;
    }
    return regions;
  }, [regions]);

  const regionLabels = useMemo<Record<string, string>>(() => {
    const labels: Record<string, string> = {};
    normalizedRegions.features.forEach((feature) => {
      const id = feature.properties?.id;
      if (!id) return;
      labels[id] = feature.properties?.name ?? id;
    });
    return labels;
  }, [normalizedRegions]);

  const regionFeatures = useMemo<
    Record<string, (typeof normalizedRegions.features)[number]>
  >(() => {
    const map: Record<string, (typeof normalizedRegions.features)[number]> = {};
    normalizedRegions.features.forEach((feature) => {
      const id = feature.properties?.id;
      if (!id) return;
      map[id] = feature;
    });
    return map;
  }, [normalizedRegions]);

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
        style={mapStyle}>
        <TileLayer {...tileLayerProps} />
        <GeoJSON {...geoJsonProps} />
        {/* Partner sites as markers */}
        {partnerSites.map((site) => (
          <PartnerMarker
            key={site.id}
            site={site}
            regionLabels={regionLabels}
            regions={regionFeatures}
          />
        ))}
      </MapContainer>
      {leftControls && (
        <div
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            zIndex: 1000,
            pointerEvents: "none",
            maxWidth: "min(420px, 120vw)",
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
    </div>
  );
}
