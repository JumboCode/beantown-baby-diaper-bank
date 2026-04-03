"use client";

import dynamic from "next/dynamic";
import { Box, Stack, Title, Text, Paper, Skeleton, Group } from "@mantine/core";
import TimelineSliderControls from "@/components/map/TimelineSliderControls";
import { useTimelinePeriod } from "@/components/map/useTimelinePeriod";
import TotalDiapersDistributed from "@/components/map/TotalDiapersDistributed";
import { useState, useCallback, useEffect } from "react";
import ImpactModal from "@/components/map/ImpactModal";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { City, Distribution } from "@/generated/prisma/client";

const LeafletMap = dynamic(() => import("@/components/map/Map"), {
  ssr: false,
});

const MapSkeleton = dynamic(() => import("@/components/map/MapSkeleton"), {
  ssr: false,
  loading: () => <Skeleton h="100%" w="100%" radius="md" />,
});

type PartnerInfoType = {
  id: number;
  name: string;
  logo_url?: string | null;
  status: "active" | "inactive" | "waitlisted" | null;
};

type CityMapInfo = City & {
  distributions: Distribution[];
  partners: PartnerInfoType[];
  historicalStats?: { median: number; p25: number; p75: number } | null;
  runningTotal?: number;
};

export type MapData = {
  boundaries: FeatureCollection<Polygon | MultiPolygon>;
  cities: { data: CityMapInfo[] };
};

const flipBoundaries = (
  data: FeatureCollection<Polygon | MultiPolygon>,
): FeatureCollection<Polygon | MultiPolygon> => {
  const swapLngLat = (coords: unknown): unknown => {
    if (!Array.isArray(coords)) {
      return coords;
    }

    if (
      coords.length >= 2 &&
      typeof coords[0] === "number" &&
      typeof coords[1] === "number"
    ) {
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
            coordinates: swapLngLat(
              feature.geometry.coordinates,
            ) as Polygon["coordinates"],
          }
        : {
            ...feature.geometry,
            coordinates: swapLngLat(
              feature.geometry.coordinates,
            ) as MultiPolygon["coordinates"],
          },
  }));

  return {
    ...data,
    features: flippedFeatures,
  };
};

export default function Page() {
  const timeline = useTimelinePeriod();
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [totalDiapers, setTotalDiapers] = useState<number>();
  const [cumulativeTotalDiapers, setCumulativeTotalDiapers] =
    useState<number>();
  const [yearlyTotalDiapers, setYearlyTotalDiapers] = useState<number>();
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
    async (params: { month?: string; year: string }) => {
      try {
        const queryParams = new URLSearchParams({
          year: params.year,
        });

        if (params.month) {
          queryParams.append("month", params.month);
        }

        const boundariesPromise = cachedBoundaries
          ? Promise.resolve(cachedBoundaries)
          : fetch(`/api/cities/boundaries`)
              .then((res) => res.json())
              .then(flipBoundaries);

        const [cities, boundaries, totalDiapersResponse] = await Promise.all([
          fetch(`/api/cities?${queryParams.toString()}`).then((res) =>
            res.json(),
          ),
          boundariesPromise,
          fetch(
            `/api/total-diapers?year=${encodeURIComponent(params.year)}`,
          ).then((res) => res.json()),
        ]);

        if (!cachedBoundaries) {
          setCachedBoundaries(boundaries);
        }

        setMapData({ cities, boundaries });
        setSelectedYear(params.year);
        setCumulativeTotalDiapers(totalDiapersResponse.totalDiapers ?? 0);
        setYearlyTotalDiapers(totalDiapersResponse.yearlyTotalDiapers ?? 0);
      } catch (error) {
        console.error("Error fetching map data:", error);
        setCumulativeTotalDiapers(0);
        setYearlyTotalDiapers(0);
      }
    },
    [cachedBoundaries],
  );

  useEffect(() => {
    const fetchAllTimeTotalDiapers = async () => {
      try {
        const response = await fetch("/api/total-diapers");
        const data = await response.json();
        setTotalDiapers(data.totalDiapers ?? 0);
      } catch (error) {
        console.error("Error fetching total diapers:", error);
        setTotalDiapers(0);
      }
    };

    fetchAllTimeTotalDiapers();
  }, []);

  return (
    <Box
      style={{
        backgroundColor: "#FFFFFF",
        minHeight: "100vh",
        paddingRight: "8%",
        paddingLeft: "8%",
        paddingTop: "3%",
        paddingBottom: "3%",
      }}
    >
      <Stack gap="sm" mx="auto">
        <Box>
          <Title order={1} fz="30px" fw={500} mb="xs" c="#101828">
            See where diapers are distributed
          </Title>
          <Group align="center" mb="md" gap="xs">
            <Text fz="18px" c="#667085">
              Last data uploaded:
            </Text>
            {lastUploaded ? (
              <Text fz="18px" c="#667085" fw={500} inline inherit>
                {lastUploaded}
              </Text>
            ) : (
              <Skeleton w={100} h={16} radius="sm" />
            )}
          </Group>
        </Box>

        <TotalDiapersDistributed totalDiapers={totalDiapers} />

        <Group justify="space-between" align="center" mt="md">
          <Title fz={24} c="#101728" fw={600}>
            Distribution Heat Map
          </Title>
          <ImpactModal />
        </Group>
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Box h="60vh" pos="relative" mb="md">
            {mapData ? (
              <LeafletMap
                mapData={mapData}
                timelineSlider={timeline}
                totalDiapersForYear={cumulativeTotalDiapers}
                yearlyDistributed={yearlyTotalDiapers}
                selectedYear={selectedYear}
              />
            ) : (
              <MapSkeleton />
            )}
          </Box>

          <TimelineSliderControls
            view={timeline.view}
            index={timeline.index}
            setIndex={timeline.setIndex}
            move={timeline.move}
            labels={timeline.labels}
            onTimelineChange={handleTimelineChange}
          />
        </Paper>
      </Stack>
    </Box>
  );
}
