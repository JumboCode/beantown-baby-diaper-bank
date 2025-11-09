"use client";

import dynamic from "next/dynamic";
import { useLeafletMap } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
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

export default function LeafletMap() {
  const { mapConfig } = useLeafletMap();
  const { style: mapStyle, ...mapOptions } = mapConfig;
  const { tileLayerProps } = useBaseTileLayer();

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
      </MapContainer>
    </div>
  );
}
