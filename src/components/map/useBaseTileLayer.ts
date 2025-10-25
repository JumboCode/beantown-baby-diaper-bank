import { useMemo } from "react";
import type { TileLayerProps } from "react-leaflet";

export function useBaseTileLayer() {
  const tileLayerProps = useMemo<TileLayerProps>(
    () => ({
      // url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      // attribution: "&copy; OpenStreetMap contributors",
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
    }),
    []
  );

  return { tileLayerProps };
}
