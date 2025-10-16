import { useMemo } from "react";
import type { TileLayerProps } from "react-leaflet";

export function useBaseTileLayer() {
  const tileLayerProps = useMemo<TileLayerProps>(
    () => ({
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors",
    }),
    []
  );

  return { tileLayerProps };
}
