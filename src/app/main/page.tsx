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

// hex values: 1(#B2E5FF) 2(#7EC3E5) 3(#51A3CC) 4(#2C85B2) 5(#0F6B99)

const LeafletMap = dynamic(() => import("@/components/map/Map"), {
  ssr: false,
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
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [totalDiapers, setTotalDiapers] = useState<number>();
  const [cumulativeTotalDiapers, setCumulativeTotalDiapers] = useState<number>();
  const [yearlyTotalDiapers, setYearlyTotalDiapers] = useState<number>();
  const [selectedYear, setSelectedYear] = useState<string>();
  const [cachedBoundaries, setCachedBoundaries] =
    useState<FeatureCollection<Polygon | MultiPolygon> | null>(null);

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
          fetch(`/api/total-diapers?year=${encodeURIComponent(params.year)}`).then(
            (res) => res.json(),
          ),
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
      <Stack
        // p="md"
        gap="sm"
        mx="auto"
      >
        {/* Header */}
        <Box>
          <Title order={1} fz="30px" fw={500} mb="xs" c="#101828">
            See where diapers are distributed
          </Title>
          <Text fz="18px" c="#667085">
            Last updated: Sep 9th, 2025.
          </Text>
        </Box>
        {/* Total Diapers Card */}
        <TotalDiapersDistributed totalDiapers={totalDiapers} />

        {/* Map Section with Timeline and Impact Modal - Two Column Layout */}
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
              <Skeleton h="60vh" mb="md" />
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
