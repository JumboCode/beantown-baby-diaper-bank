import type { GeoJSONProps } from "react-leaflet";
import type { RegionFeature, RegionsGeoJSON } from "@/lib/types";

type UseRegionsLayerOptions = {
  regions: RegionsGeoJSON;
  onRegionClick: (regionId: string) => void;
  // Optional map of region impacts used to color regions by metric (e.g., fulfillmentRate)
  impacts?: Record<string, { fulfillmentRate?: number } | undefined>;
};

export function useRegionsLayer({
  regions,
  onRegionClick,
  impacts,
}: UseRegionsLayerOptions) {
  const onEachFeature: NonNullable<GeoJSONProps["onEachFeature"]> = (
    feature,
    layer
  ) => {
    const region = feature as RegionFeature | undefined;
    const regionId = region?.properties?.id;
    if (!regionId) return;

    layer.on("click", () => onRegionClick(regionId));
  };

  const style: NonNullable<GeoJSONProps["style"]> = (feature) => {
    const region = feature as RegionFeature | undefined;
    const id = region?.properties?.id;
    const impact = id ? impacts?.[id] : undefined;
    const rate = impact?.fulfillmentRate;

    // Color by fulfillment rate: green (high) -> orange (medium) -> red (low).
    let fillColor = "#94d2bd"; // default
    if (typeof rate === "number") {
      if (rate >= 0.85) fillColor = "#2ca02c";
      else if (rate >= 0.75) fillColor = "#ff7f0e";
      else fillColor = "#d62728";
    }

    return {
      color: "#2c3e50",
      weight: 1,
      fillColor,
      fillOpacity: 0.6,
    };
  };

  return {
    geoJsonProps: {
      data: regions,
      onEachFeature,
      style,
    } satisfies GeoJSONProps,
  };
}
