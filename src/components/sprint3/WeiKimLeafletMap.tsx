"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useEffect, useState, type ReactNode } from "react";
import "leaflet/dist/leaflet.css";
import { useRegionsLayer, type ChoroplethBucket } from "../map/useRegionsLayer";
import type { RegionsGeoJSON } from "@/lib/types";
import type * as Leaflet from "leaflet";
import { Baby } from "lucide-react";
import { renderToString } from "react-dom/server";

// NEW: bring in Leaflet runtime for icons, and popup content + types
// import * as L from "leaflet";
import { DotPopupContent } from "@/components/DotPopupContent";
import type { DotDatum } from "@/components/DotPopupContent";
import { useLeafletMap } from "../map/useLeafletMap";
import { useBaseTileLayer } from "../map/useBaseTileLayer";
// import { Tooltip } from "react-leaflet";

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

// NEW: dynamic imports for Marker and Popup
const Marker = dynamic(
  () => import("react-leaflet").then((module) => module.Marker),
  { ssr: false }
);

const Tooltip = dynamic(
  () => import("react-leaflet").then((module) => module.Tooltip),
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
  dotData?: DotDatum[];
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
  dotData = [],
}: LeafletMapProps) {
  const { mapConfig } = useLeafletMap();
  const { style: mapStyle, ...mapOptions } = mapConfig;
  // const [mapInstance, setMapInstance] = useState<Leaflet.Map | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const [babyIcon, setBabyIcon] = useState<Leaflet.DivIcon | null>(null);

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    (async () => {
      const L = await import("leaflet"); // dynamically import leaflet
      const svgString = renderToString(
        <Baby
          size={30}
          color="#008080"
          strokeWidth={3.5}
        />
      );

      const icon = L.divIcon({
        className: "custom-baby-icon",
        html: svgString,
        iconSize: [30, 30],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });

      setBabyIcon(icon);
    })();
  }, []);

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
        ref={mapRef}
        whenReady={() => {
          // whenReady fires after initial render
          // we can ensure the ref is populated
          if (!mapRef.current) return;
          // mapRef.current is your Leaflet map instance
        }}>
        <TileLayer {...tileLayerProps} />
        <GeoJSON {...geoJsonProps} />
        {dotData.map((dot) => (
          <Marker
            key={dot.cityId}
            position={[dot.lat, dot.lng]}
            {...(babyIcon ? { icon: babyIcon } : {})}>
            <Tooltip
              sticky
              direction="top"
              offset={[0, -10]}>
              <DotPopupContent
                cityName={dot.cityName}
                numDiapers={dot.numDiapers}
                partnerOrgs={dot.partnerOrgs}
              />
            </Tooltip>
          </Marker>
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
    </div>
  );
}
