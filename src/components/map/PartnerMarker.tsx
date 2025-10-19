"use client";
import { useMap } from "react-leaflet";
import { Marker, Popup } from "./LeafletMap";
import { usePartnerIcon } from "./usePartnerIcon";
import { PartnerSite, RegionsGeoJSON } from "@/lib/types";

export type PartnerMarkerProps = {
  site: PartnerSite;
  regions: Record<string, RegionsGeoJSON["features"][number]>;
  regionLabels: Record<string, string>;
  selectedRegionId?: string | null;
};

export function PartnerMarker({
  site,
  regions,
  regionLabels,
  selectedRegionId,
}: PartnerMarkerProps) {
  const icon = usePartnerIcon(site);
  const map = useMap();

  const onRegionSelect = (regionId: string) => {
    map.flyTo(
      regions[regionId]?.properties?.centroid ?? [0, 0],
      Math.max(map.getZoom(), 13),
      {
        duration: 0.75,
      }
    );
    if (selectedRegionId !== regionId) {
      // Slight delay to ensure the map has moved before updating the selected region
      setTimeout(() => {
        const regionElement = document.querySelector<SVGElement>(
          `[data-region-id="${regionId}"]`
        );

        if (regionElement) {
          regionElement.dispatchEvent(
            new MouseEvent("click", { bubbles: true })
          );
        }
      }, 800);
    }
  };

  console.log("MAP INSTANCE IN PARTNER MARKER", map);
  if (!icon) return null;
  const regionIds = site.regionsServed ?? [];
  return (
    <Marker
      icon={icon}
      position={[site.location.lat, site.location.lng]}>
      <Popup>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            minWidth: "12rem",
            zIndex: -1,
          }}>
          <strong>{site.name}</strong>
          {site.description && <p>{site.description}</p>}
          {site.start_partnering_date && (
            <p>Partnering since: {site.start_partnering_date}</p>
          )}
          {regionIds.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}>
                Regions Served
              </span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.4rem",
                }}>
                {regionIds.map((regionId) => (
                  <button
                    key={regionId}
                    type="button"
                    onClick={() => onRegionSelect(regionId)}
                    style={{
                      border: "1px solid #93c5fd",
                      background: "#e0f2ff",
                      color: "#1d4ed8",
                      borderRadius: "999px",
                      padding: "0.25rem 0.6rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}>
                    {regionLabels[regionId] ?? regionId}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
