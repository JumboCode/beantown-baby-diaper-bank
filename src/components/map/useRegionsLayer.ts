import { useCallback, useMemo } from "react";
import type { GeoJSONProps } from "react-leaflet";
import type { RegionFeature, RegionsGeoJSON } from "@/lib/types";

type UseRegionsLayerOptions = {
  regions: RegionsGeoJSON;
  onRegionClick: (regionId: string) => void;
  onRegionHover?: (regionId?: string) => void;
};

type GeoJSONEachFeature = NonNullable<GeoJSONProps["onEachFeature"]>;

function resolveRegionId(feature: RegionFeature | undefined) {
  return feature?.properties?.id;
}

/**
 * Custom React hook to generate props for rendering a GeoJSON layer of regions on a map.
 *
 * This hook provides memoized props for a GeoJSON component, including styling and event handlers
 * for region features. It highlights regions on hover and handles region click events.
 *
 * @param options - Options for configuring the regions layer.
 * @param options.regions - The GeoJSON FeatureCollection representing the regions to display.
 * @param options.onRegionClick - Callback invoked with the region ID when a region is clicked.
 * @param options.onRegionHover - (Optional) The currently hovered region's ID, used to highlight the region.
 *
 * @returns An object containing `geoJsonProps`, which should be spread onto a GeoJSON component.
 *
 * @example
 * ```tsx
 * const { geoJsonProps } = useRegionsLayer({
 *   regions,
 *   onRegionClick: handleRegionClick,
 *   onRegionHover: hoveredRegionId,
 * });
 * <GeoJSON {...geoJsonProps} />
 * ```
 */
export function useRegionsLayer({
  regions,
  onRegionClick,
  onRegionHover,
}: UseRegionsLayerOptions) {
  // Handle feature clicks, binding to onRegionClick
  // if regionId is not found, do nothing
  // if onRegionClick changes, re-bind handlers
  const onEachFeature = useCallback<GeoJSONEachFeature>(
    (feature, layer) => {
      const regionFeature = feature as RegionFeature | undefined;
      const regionId = resolveRegionId(regionFeature);

      layer.on({
        click: () => {
          if (regionId) {
            onRegionClick(regionId);
          }
        },
        mouseover: () => {
          if (regionId && typeof onRegionHover === "function") {
            onRegionHover(regionId);
          }
        },
        mouseout: () => {
          if (typeof onRegionHover === "function") {
            onRegionHover();
          }
        },
      });
    },
    [onRegionClick, onRegionHover]
  );

  const geoJsonProps = useMemo<GeoJSONProps>(
    () => ({
      data: regions,
      onEachFeature,
    }),
    [onEachFeature, regions]
  );

  return { geoJsonProps };
}
