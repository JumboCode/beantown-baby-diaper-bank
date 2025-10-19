import { useMemo } from "react";
import type { TileLayerProps } from "react-leaflet";

export function useBaseTileLayer() {
  const tileLayerProps = useMemo<TileLayerProps>(
    () => ({
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: ["a", "b", "c", "d"],
    }),
    []
  );

  return { tileLayerProps };
}
