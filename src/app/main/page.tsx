"use client";

import dynamic from "next/dynamic";
import { Box, Stack, Title, Text, Paper, Skeleton } from "@mantine/core";
import TimelineSliderControls from "@/components/TimelineSliderControls";
import { useTimelinePeriod } from "@/components/useTimelinePeriod";
import TotalDiapersDistributed from "@/components/TotalDiapersDistributed";
import { useState, useEffect, useCallback } from "react";
import ImpactModal from "@/components/ImpactModal";
import { FeatureCollection, Polygon } from "geojson";
import { City, Distribution } from "@/generated/prisma/client";
import { SimpleGrid } from "@mantine/core";
import YearlyMonthlySwitch from "@/components/sprint2/YearlyMonthlySwitch";

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
  boundaries: FeatureCollection<Polygon>;
  cities: { data: CityMapInfo[] };
};

const flipBoundaries = (
  data: FeatureCollection<Polygon>,
): FeatureCollection<Polygon> => {
  const flippedFeatures = data.features.map((feature) => ({
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: feature.geometry.coordinates.map(
        (ring) => ring.map((coord) => [coord[1], coord[0]]), // Swap index 0 and 1
      ),
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
  const [cachedBoundaries, setCachedBoundaries] =
    useState<FeatureCollection<Polygon> | null>(null);

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

        const [cities, boundaries] = await Promise.all([
          fetch(`/api/cities?${queryParams.toString()}`).then((res) =>
            res.json(),
          ),
          boundariesPromise,
        ]);

        if (!cachedBoundaries) {
          setCachedBoundaries(boundaries);
        }

        setMapData({ cities, boundaries });
      } catch (error) {
        console.error("Error fetching map data:", error);
      }
    },
    [cachedBoundaries],
  );

  useEffect(() => {
    // fetch data for total diapers distributed
    const fetchTotalDiapers = async () => {
      try {
        const url = `/api/total-diapers`;

        const response = await fetch(url);
        const data = await response.json();
        const total = data.totalDiapers;

        setTotalDiapers(total);
      } catch (error) {
        console.error("Error fetching total diapers:", error);
        setTotalDiapers(0);
      }
    };
    fetchTotalDiapers();
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
        <Title
          fz={24}
          c="#101728"
          // mb="md"
          mt="md"
          fw={600}
        >
          Distribution Heat Map
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={{base: 0, sm: '3%'}} verticalSpacing={{base: '3%', sm: 0}}>
          {/* Left Column: Map */}
          <div style={{ gridColumn: 'span 2' }}>
            <Paper shadow="sm" p="md" radius="md" withBorder>
              <Box mb="md">
                <YearlyMonthlySwitch
                  value={timeline.view}
                  onChange={timeline.toggleView}
                />
              </Box>
              <Box h="60vh" pos="relative" mb="md">
                {mapData ? (
                  <LeafletMap mapData={mapData} />
                ) : (
                  <Skeleton h="60vh" mb="md" />
                )}
              </Box>

              {/* Timeline Slider below map */}

              <TimelineSliderControls
                view={timeline.view}
                index={timeline.index}
                setIndex={timeline.setIndex}
                move={timeline.move}
                labels={timeline.labels}
                onTimelineChange={handleTimelineChange}
              />
            </Paper>
          </div>

          {/* Right Column: Impact Modal */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-center",
            }}
          >
            <ImpactModal />
          </div>
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
