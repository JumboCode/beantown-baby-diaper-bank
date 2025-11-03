"use client";

import dynamic from "next/dynamic";
import { useMemo, type ReactNode } from "react";
import { Loader } from "@mantine/core";
import { useLeafletMap } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
import { useRegionsLayer, type ChoroplethBucket } from "./useRegionsLayer";
import type { RegionsGeoJSON } from "@/lib/types";
import type * as Leaflet from "leaflet";
import { Baby } from "lucide-react";
import { renderToString } from "react-dom/server";

// NEW: bring in Leaflet runtime for icons, and popup content + types
// import * as L from "leaflet";
import { DotPopupContent } from "@/lib/DotPopupContent";
import type { DotDatum } from "@/lib/DotPopupContent";
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

  const babyIcon = useMemo(() => {
    // Only run in browser
    if (typeof window === "undefined") {
      return null;
    }
  
    // import leaflet at runtime, after window exists
    const L = require("leaflet");
  
    const svgString = renderToString(
      <Baby size={30} color="#008080" strokeWidth={3.5} />
    );
  
    return L.divIcon({
      className: "custom-baby-icon",
      html: svgString,
      iconSize: [30, 30],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
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
        style={mapStyle}
        whenReady={() => {
          // whenReady fires after initial render
          // we can ensure the ref is populated
          if (!mapRef.current) return;
          // mapRef.current is your Leaflet map instance
        }}
      >
        <TileLayer {...tileLayerProps} />
        <GeoJSON {...geoJsonProps} />
        {dotData.map((dot) => (
          <Marker
            key={dot.cityId}
            position={[dot.lat, dot.lng]}
            {...(babyIcon ? { icon: babyIcon } : {})}
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
      {!mapRef && <Loader />}
    </div>
  );
}
