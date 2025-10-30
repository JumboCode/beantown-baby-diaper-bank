"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, type ReactNode } from "react";
import { Loader } from "@mantine/core";
import { useLeafletMap } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
import { useRegionsLayer, type ChoroplethBucket } from "./useRegionsLayer";
import type { RegionsGeoJSON } from "@/lib/types";
import type * as Leaflet from "leaflet";
import { Baby } from "lucide-react";
import { renderToString } from "react-dom/server";


// NEW: bring in Leaflet runtime for icons, and popup content + types
import * as L from "leaflet";
import { DotPopupContent } from "@/lib/DotPopupContent";
import type { DotDatum } from "@/lib/DotPopupContent";
import { Tooltip } from "react-leaflet";

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

const Popup = dynamic(
  () => import("react-leaflet").then((module) => module.Popup),
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

  // const circleDotIcon = useMemo(() => {
  //   return L.divIcon({
  //     className: "temp-square-icon",
  //     html: `
  //       <div
  //         style="
  //           width:20px;
  //           height:20px;
  //           background-color:#008080; /* blue-800 */
  //           border:1px solid white;
  //           border-radius:5px;
  //           box-shadow:0 0 4px rgba(0,0,0,0.5);
  //         "
  //       ></div>
  //     `,
  //     iconSize: [16, 16],
  //     iconAnchor: [8, 8], // center icon over the lat/lng
  //   });
  // }, []);

  const babyIcon = useMemo(() => {
    // Convert the Lucide React icon into an SVG string
    const svgString = renderToString(
      <Baby size={30} color="#008080" strokeWidth={3.5} />
    );
  
    // Use it as the HTML for a Leaflet divIcon
    return L.divIcon({
      className: "custom-baby-icon",
      html: svgString,
      iconSize: [30, 30],     // pixel dimensions of the icon
      iconAnchor: [12, 12],   // center the icon on the map coordinate
      popupAnchor: [0, -12],  // offset popups above the icon
    });
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
        style={mapStyle}>
        whenCreated={(map) => {
          setMapInstance(map);
        }}
        <TileLayer {...tileLayerProps} />
        <GeoJSON {...geoJsonProps} />
        {dotData.map((dot) => (
          <Marker
            key={dot.cityId}
            position={[dot.lat, dot.lng]}
            icon={babyIcon}
          >
            <Tooltip sticky direction="top" offset={[0, -10]}>
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
      {!mapInstance && <Loader />}
    </div>
  );
}
