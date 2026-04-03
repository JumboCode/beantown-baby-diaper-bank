"use client";

import dynamic from "next/dynamic";
import { Box, Skeleton } from "@mantine/core";
import TimelineSlider from "@/components/map/TimelineSlider";
import { useTimelinePeriod } from "@/components/map/useTimelinePeriod";
import { useState, useCallback, useEffect } from "react";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { GeoJsonBoundaries, CityWithStats } from "@/lib/types";

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

  const [lastUploaded, setLastUploaded] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  const fetchTimelineData = useCallback(async () => {
    try {
      const res = await fetch(`/api/timeline-slider?year=${currentYear}`);
      const data = await res.json();
      if (data.months) {
        const validMonths = data.months.filter(
          (d: { Month: string | null; Year: string | null }) =>
            typeof d.Month === "string" && typeof d.Year === "string",
        );

        if (validMonths.length > 0) {
          const last = validMonths[validMonths.length - 1];
          setLastUploaded(`${last.Month} ${last.Year}`);
        } else {
          setLastUploaded(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch timeline data:", err);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchTimelineData();
  }, [fetchTimelineData]);

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
        console.error("Error fetching map data:", error);
        setCumulativeTotalDiapers(0);
      }
    },
    [cachedBoundaries],
  );

  useEffect(() => {
    // Trigger initial load with the current timeline value
  }, []);

  return (
    <Box
      style={{
        height: "100vh",
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
          padding: "10px 24px",
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
