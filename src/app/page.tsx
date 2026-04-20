"use client";

import dynamic from "next/dynamic";
import TimelineSlider from "@/components/map/TimelineSlider";
import { useTimelinePeriod } from "@/components/map/useTimelinePeriod";
import { useState, useCallback } from "react";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { GeoJsonBoundaries, CityWithStats } from "@/lib/types";
import { Box, Skeleton } from "@mantine/core";

const LeafletMap = dynamic(() => import("@/components/map/Map"), {
  ssr: false,
});

const MapSkeleton = dynamic(() => import("@/components/map/MapSkeleton"), {
  ssr: false,
  loading: () => <Skeleton h="100%" w="100%" radius={0} />,
});

const flipBoundaries = (
  data: FeatureCollection<Polygon | MultiPolygon>,
): FeatureCollection<Polygon | MultiPolygon> => {
  const swapLngLat = (coords: unknown): unknown => {
    if (!Array.isArray(coords)) {
      return coords;
    }

    if (coords.length >= 2 && typeof coords[0] === "number" && typeof coords[1] === "number") {
      const [lng, lat, ...rest] = coords;
      return [lat, lng, ...rest];
    }

    return coords.map(swapLngLat);
  };

  const flippedFeatures = data.features.map((feature) => ({
    ...feature,
    geometry:
      feature.geometry.type === "Polygon"
        ? {
            ...feature.geometry,
            coordinates: swapLngLat(feature.geometry.coordinates) as Polygon["coordinates"],
          }
        : {
            ...feature.geometry,
            coordinates: swapLngLat(feature.geometry.coordinates) as MultiPolygon["coordinates"],
          },
  }));

  return {
    ...data,
    features: flippedFeatures,
  };
};

export default function Page() {
  const timeline = useTimelinePeriod();
  const [boundaries, setBoundaries] = useState<GeoJsonBoundaries | null>(null);
  const [cities, setCities] = useState<CityWithStats[]>([]);
  const [cumulativeTotalDiapers, setCumulativeTotalDiapers] = useState<number>();
  const [selectedYear, setSelectedYear] = useState<string>();
  const [cachedBoundaries, setCachedBoundaries] = useState<FeatureCollection<
    Polygon | MultiPolygon
  > | null>(null);
  const [mapError, setMapError] = useState<Error | null>(null);

  const handleTimelineChange = useCallback(
    async (year: string) => {
      try {
        const boundariesPromise = cachedBoundaries
          ? Promise.resolve(cachedBoundaries)
          : fetch(`/api/cities/boundaries`)
              .then((res) => res.json())
              .then(flipBoundaries);

        const [cities, boundaries, totalDiapersResponse] = await Promise.all([
          fetch(`/api/cities?year=${encodeURIComponent(year)}`).then((res) => res.json()),
          boundariesPromise,
          fetch(`/api/total-diapers?year=${encodeURIComponent(year)}`).then((res) => res.json()),
        ]);

        if (!cachedBoundaries) {
          setCachedBoundaries(boundaries);
        }

        setBoundaries(boundaries);
        setCities(cities.data);
        setSelectedYear(year);
        setCumulativeTotalDiapers(totalDiapersResponse.totalDiapers ?? 0);
      } catch (error) {
        setMapError(error as Error);
        console.error("Error fetching map data:", error);
        setCumulativeTotalDiapers(0);
      }
    },
    [cachedBoundaries],
  );

  if (mapError) throw mapError;

  return (
    <Box
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* Map — fills all available height */}
      <Box style={{ flex: 1, position: "relative", minHeight: 0 }}>
        {boundaries && cities ? (
          <LeafletMap
            boundaries={boundaries}
            cities={cities}
            year={timeline.labels[timeline.index] ?? ""}
            totalDiapersForYear={cumulativeTotalDiapers}
            selectedYear={selectedYear}
          />
        ) : (
          <MapSkeleton />
        )}
      </Box>

      {/* Timeline footer */}
      <Box
        style={{
          background: "#ffffff",
          borderTop: "1px solid #E4E7EC",
          padding: "10px 16px",
          flexShrink: 0,
        }}
      >
        <TimelineSlider
          index={timeline.index}
          setIndex={timeline.setIndex}
          move={timeline.move}
          labels={timeline.labels}
          onTimelineChange={handleTimelineChange}
        />
      </Box>
    </Box>
  );
}
