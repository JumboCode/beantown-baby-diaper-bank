import { useMemo } from "react";
import type { TileLayerProps } from "react-leaflet";

/**
 * Returns a memoized set of TileLayerProps configured for the application's base map.
 *
 * The returned props are ready to be passed to a Leaflet/React-Leaflet <TileLayer /> and include:
 * - url: CartoDB "light_all" tile URL with subdomain and retina placeholders,
 * - attribution: HTML string containing OpenStreetMap and CARTO attributions,
 * - subdomains: array of tile subdomains.
 *
 * The TileLayerProps object is memoized with useMemo and an empty dependency array, so its reference
 * remains stable across renders and is safe to spread onto a <TileLayer /> without causing unnecessary updates. Check out react useMemo docs for more info: https://react.dev/reference/react/useMemo
 *
 *
 * @returns An object containing the memoized TileLayerProps:
 *   { tileLayerProps: TileLayerProps }
 *
 * @example
 * const { tileLayerProps } = useBaseTileLayer();
 * return <TileLayer {...tileLayerProps} />;
 */
export function useBaseTileLayer() {
  const tileLayerProps = useMemo<TileLayerProps>(
    () => ({
      url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: ["a", "b", "c", "d"],
    }),
    [],
  );

  const labelLayerProps = useMemo<TileLayerProps>(
    () => ({
      url: "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
      attribution: "",
      subdomains: ["a", "b", "c", "d"],
      pane: "markerPane",
    }),
    [],
  );

  return { tileLayerProps, labelLayerProps };
}
