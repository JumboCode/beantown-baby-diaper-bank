import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { LatLngBoundsExpression, LatLngTuple } from "leaflet";
import type { MapContainerProps } from "react-leaflet";

// Define the configuration type for the Leaflet map
type MapConfig = Pick<
  MapContainerProps,
  | "center"
  | "zoom"
  | "scrollWheelZoom"
  | "preferCanvas"
  | "minZoom"
  | "maxZoom"
  | "maxBounds"
  | "maxBoundsViscosity"
> & { style: CSSProperties };

// Default to Boston, MA
export const DEFAULT_CENTER: LatLngTuple = [42.3601, -71.0589];
export const DEFAULT_ZOOM = 9;

// Massachusetts bounding box (with padding)
const MA_BOUNDS: LatLngBoundsExpression = [
  [41.0, -73.8],
  [43.2, -69.5],
];

/**
 * Creates and memoized a Leaflet map configuration for use with a MapContainer or similar map component.
 *
 * The configuration is created once and memoized with React's `useMemo` to avoid unnecessary re-renders
 * when the map configuration is static. If the configuration must change based on props or state,
 * include those dependencies in the `useMemo` dependency array so the memoized value updates correctly.
 *
 * The returned `mapConfig` includes common Leaflet options:
 * - `center` — default map center coordinates (uses `DEFAULT_CENTER`).
 * - `zoom` — default zoom level (uses `DEFAULT_ZOOM`).
 * - `scrollWheelZoom` — whether scroll-wheel zooming is enabled.
 * - `preferCanvas` — whether to prefer canvas rendering over SVG.
 * - `minZoom` / `maxZoom` — allowed zoom range for the map.
 * - `style` — inline style object for sizing the map container (e.g., `{ height: "100%", width: "100%" }`).
 *
 * @returns An object with a single property:
 *  - `mapConfig`: a memoized `MapConfig` suitable for passing to a Leaflet `MapContainer` or analogous component.
 *
 */
export function useLeafletMap(zoom: number = DEFAULT_ZOOM) {
  const mapConfig = useMemo<MapConfig>(
    () => ({
      center: DEFAULT_CENTER,
      zoom,
      scrollWheelZoom: true,
      preferCanvas: false,
      minZoom: 8,
      maxZoom: 18,
      maxBounds: MA_BOUNDS,
      maxBoundsViscosity: 1.0,
      style: {
        height: "100%",
        width: "100%",
      },
    }),
    [zoom],
  );

  return { mapConfig };
}
