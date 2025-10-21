import type { GeoJSONProps } from "react-leaflet";
import type { RegionFeature, RegionsGeoJSON } from "@/lib/types";

type UseRegionsLayerOptions = {
  regions: RegionsGeoJSON;
  onRegionClick: (regionId: string) => void;
};

export function useRegionsLayer({
  regions,
  onRegionClick,
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

  return {
    geoJsonProps: {
      data: regions,
      onEachFeature,
      style: () => ({
        color: "#2c3e50",
        weight: 1,
        fillColor: "#94d2bd",
        fillOpacity: 0.6,
      }),
    } satisfies GeoJSONProps,
  };
}
