"use client";

import dynamic from "next/dynamic";
import React, { type ReactNode, useEffect, useState } from "react";
import type { RegionsGeoJSON } from "@/lib/types";
import type * as GeoJSONTypes from "geojson";
import type { DivIcon } from "leaflet";
import { useLeafletMap } from "../map/useLeafletMap";
import { useBaseTileLayer } from "../map/useBaseTileLayer";
import { useRegionsLayer } from "../map/useRegionsLayer";

// Dynamically import react-leaflet components with SSR disabled
// because they depend on the browser environment (e.g., window, document).
const MapContainer = dynamic(
  () => import("react-leaflet").then((module) => module.MapContainer),
  { ssr: false },
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((module) => module.TileLayer),
  { ssr: false },
);

const GeoJSON = dynamic(
  () => import("react-leaflet").then((module) => module.GeoJSON),
  { ssr: false },
);

const CircleMarker = dynamic(
  () => import("react-leaflet").then((module) => module.CircleMarker),
  { ssr: false },
);

const Marker = dynamic(
  () => import("react-leaflet").then((module) => module.Marker),
  { ssr: false },
);

// Marker not dynamically imported here to avoid unused import when not needed.

type LeafletMapProps = {
  regions: RegionsGeoJSON;
  onRegionClick: (regionId: string) => void;
  // Optional point GeoJSON for diaper distribution locations. Points should have
  // properties like: { id, name, diapersDistributed: number }
  points?: GeoJSONTypes.FeatureCollection<
    GeoJSONTypes.Point,
    { id?: string; name?: string; diapersDistributed?: number }
  >;
  leftControls?: ReactNode;
  // Optional dummy timeline value (not currently used for filtering in this demo)
  timelineValue?: number;
};

export default function LeafletMap({
  regions,
  onRegionClick,
  leftControls,
  points,
}: LeafletMapProps) {
  // store generated DivIcons keyed by feature id
  const [iconsMap, setIconsMap] = useState<Record<string, DivIcon>>({});
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
    // Provide region impact data mapping so regions can be colored. The parent
    // can pass impacts through a prop in the future; for now the hook allows it.
  });

  // Build DivIcons for each point on the client. We do this in an effect so
  // we can dynamically import 'leaflet' (which depends on browser APIs) and
  // avoid server-side errors. While icons are not ready we still render the
  // circle markers as a visual fallback.
  useEffect(() => {
    if (!points || typeof window === "undefined") return;

    let mounted = true;
    import("leaflet")
      .then((L) => {
        const map: Record<string, DivIcon> = {};
        points.features.forEach((f, i) => {
          const id = f.properties?.id ?? String(i);
          const geom = f.geometry as GeoJSONTypes.Point | null;
          const coords = geom?.coordinates;
          if (!coords) return;
          const count = Number(f.properties?.diapersDistributed ?? 0);
          const radius = Math.min(40, Math.max(6, Math.sqrt(count) * 2));
          const size = Math.round(radius * 1.4);
          const iconHtml = `<img src="/diaper_icon.svg" width="${size}" height="${size}" style="display:block;opacity:0.75" />`;

          const divIcon = L.divIcon({
            html: iconHtml,
            className: "diaper-div-icon",
            iconSize: [size, size],
            iconAnchor: [Math.round(size / 2), Math.round(size / 2)],
          });

          map[id] = divIcon as unknown as DivIcon;
        });

        if (mounted) setIconsMap(map);
      })
      .catch(() => {
        /* ignore */
      });

    return () => {
      mounted = false;
    };
  }, [points]);

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        zIndex: 0,
      }}
    >
      <MapContainer {...mapOptions} style={mapStyle}>
        {/* Base tile layer for the map */}
        <TileLayer {...tileLayerProps} />

        {/* Regions layer with click handling */}
        <GeoJSON {...geoJsonProps} />

        {/* Optional point features (diaper distribution locations).
            We render these as circle markers sized by the `diapersDistributed` property.
            If you prefer an icon (e.g., a diaper SVG), replace CircleMarker with Marker
            and use the `icon` prop. See the comment in the calling code for where to
            insert a diaper icon. */}
        {points && (
          <>
            {points.features.map((f, i) => {
              const geom = f.geometry as GeoJSONTypes.Point | null;
              const coords = geom?.coordinates;
              if (!coords) return null;
              const [lng, lat] = coords as [number, number];
              const count = Number(f.properties?.diapersDistributed ?? 0);
              // radius in pixels scaled from count (min 6, max 40)
              const radius = Math.min(40, Math.max(6, Math.sqrt(count) * 2));

              // Render the circle marker (visual backing)
              // Color the circle by diaper count buckets (four buckets):
              // 100K+ => neon, 50K-100K => red, 10K-50K => green, <10K => blue
              const colorForCount = (c: number) => {
                if (c >= 100000)
                  return { color: "#2bb30f", fillColor: "#39FF14" }; // neon
                if (c >= 50000)
                  return { color: "#cc0000", fillColor: "#ff4d4d" }; // red
                if (c >= 10000)
                  return { color: "#008f00", fillColor: "#00cc00" }; // green
                return { color: "#0047ab", fillColor: "#6699ff" }; // blue
              };

              const circleColors = colorForCount(count);

              const circle = (
                <CircleMarker
                  key={`circle-${f.properties?.id ?? i}`}
                  center={[lat, lng]}
                  radius={radius}
                  pathOptions={{
                    color: circleColors.color,
                    fillColor: circleColors.fillColor,
                    fillOpacity: 0.5,
                  }}
                />
              );

              const id = f.properties?.id ?? String(i);
              const icon = iconsMap[id];

              return (
                <span key={`wrap-${f.properties?.id ?? i}`}>
                  {circle}
                  {icon ? (
                    <Marker
                      key={`marker-${id}`}
                      position={[lat, lng]}
                      icon={icon}
                    />
                  ) : null}
                </span>
              );
            })}
          </>
        )}
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
          }}
        >
          <div style={{ pointerEvents: "auto" }}>{leftControls}</div>
        </div>
      )}
    </div>
  );
}
