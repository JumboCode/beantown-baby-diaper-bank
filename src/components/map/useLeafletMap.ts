import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { LatLngTuple } from "leaflet";
import type { MapContainerProps } from "react-leaflet";

// Define the configuration type for the Leaflet map
type MapConfig = Pick<
  MapContainerProps,
  "center" | "zoom" | "scrollWheelZoom" | "preferCanvas" | "minZoom" | "maxZoom"
> & { style: CSSProperties };

// Default to Boston, MA
const DEFAULT_CENTER: LatLngTuple = [42.3601, -71.0589];
const DEFAULT_ZOOM = 10;

// Custom hook to provide Leaflet map configuration
export function useLeafletMap() {
  // Memoize the map configuration to avoid unnecessary re-renders
  // of the MapContainer component.
  // The configuration is static in this example, but if it were
  // to depend on props or state, those dependencies should be
  // included in the dependency array.
  const mapConfig = useMemo<MapConfig>(
    () => ({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: true,
      preferCanvas: false,
      minZoom: 2,
      maxZoom: 18,
      style: {
        height: "100%",
        width: "100%",
      },
    }),
    []
  );

  return { mapConfig };
}
