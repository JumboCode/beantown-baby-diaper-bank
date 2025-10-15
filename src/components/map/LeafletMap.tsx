"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Loader } from "@mantine/core";
import { useLeafletMap } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
import { useRegionsLayer } from "./useRegionsLayer";
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
};

export default function LeafletMap(props: LeafletMapProps) {
  const { regions, onRegionClick, onRegionHover } = props;
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
  });

  console.log("Rendering LeafletMap with regions:", normalizedRegions);
  console.log("Map options:", mapOptions);
  console.log("Tile layer props:", tileLayerProps);
  console.log("GeoJSON props:", geoJsonProps);

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
        whenReady={() => setMapInstance(mapInstance)}>
        <TileLayer {...tileLayerProps} />
        <GeoJSON {...geoJsonProps} />
      </MapContainer>
      {!mapInstance && <Loader />}
    </div>
  );
}
