"use client";

import dynamic from "next/dynamic";
import {
  Box,
  Stack,
  Title,
  Text,
  Paper,
  Loader,
  Skeleton,
} from "@mantine/core";
import TimelineSliderControls from "@/components/TimelineSliderControls";
import { useTimelinePeriod } from "@/components/useTimelinePeriod";
import TotalDiapersDistributed from "@/components/TotalDiapersDistributed";
import { useState, useEffect, useCallback } from "react";
import ImpactModal from "@/components/ImpactModal";
import { FeatureCollection, Point, Polygon } from "geojson";
import { City, Distribution } from "@/generated/prisma/client";
import { Grid } from "@mantine/core";
import YearlyMonthlySwitch from "@/components/sprint2/YearlyMonthlySwitch";

// hex values: 1(#B2E5FF) 2(#7EC3E5) 3(#51A3CC) 4(#2C85B2) 5(#0F6B99)

const LeafletMap = dynamic(() => import("@/components/map/Map"), {
  ssr: false,
});
type PartnerInfoType = {
  id: number;
  name: string;
  logo_url?: string | null;
};

type CityMapInfo = City & {
  distributions: Distribution[];
  partners: PartnerInfoType[];
};

export type MapData = {
  centroids: FeatureCollection<Point>;
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

  const handleTimelineChange = useCallback(
    async (params: { month?: string; year: string }) => {
      try {
        const queryParams = new URLSearchParams({
          year: params.year,
        });

        if (params.month) {
          queryParams.append("month", params.month);
        }

        const [cities, centroids, boundaries] = await Promise.all([
          fetch(`/api/cities?${queryParams.toString()}`).then((res) =>
            res.json(),
          ),
          fetch(`/api/cities/centroids`).then((res) => res.json()),
          fetch(`/api/cities/boundaries`).then((res) => res.json()),
        ]);

        const boundariesFlipped = flipBoundaries(boundaries);

        setMapData({ centroids, cities, boundaries: boundariesFlipped });
      } catch (error) {
        console.error("Error fetching map data:", error);
      }
    },
    [],
  );

  useEffect(() => {
    const label = timeline.labels[timeline.index];
    if (!label) return;

    if (timeline.view === "monthly") {
      const [month, year] = String(label).split(" ");
      if (year) handleTimelineChange({ month, year });
    } else {
      handleTimelineChange({ year: String(label) });
    }
  }, [timeline.view, timeline.index, timeline.labels]);

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
        paddingRight: "72px",
        paddingLeft: "72px",
        paddingTop: "44px",
        paddingBottom: "44px",
      }}
    >
      <Stack
        // p="md"
        gap="sm"
        mx="auto"
      >
        {/* Header */}
        <Box>
          <Title
            order={1}
            // size="h2"
            fz="30px"
            fw={500}
            mb="xs"
            c="#101828"
          >
            See where diapers are distributed
          </Title>
          <Text
            // size="sm"
            fz="18px"
            c="#667085"
          >
            Last updated: Sep 9th, 2025.
          </Text>
        </Box>
        {/* Total Diapers Card */}
        <TotalDiapersDistributed totalDiapers={totalDiapers} />

        {/* Map Section with Timeline and Impact Modal - Two Column Layout */}
        <Title
          // order={2}
          fz={24}
          c="#101728"
          // mb="md"
          mt="md"
          fw={600}
        >
          Distribution Heat Map
        </Title>
        <Grid>
          {/* Left Column: Map */}
          <Grid.Col span="auto">
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
                toggleView={timeline.toggleView}
                move={timeline.move}
                labels={timeline.labels}
                onTimelineChange={handleTimelineChange}
              />
            </Paper>
          </Grid.Col>

          {/* Right Column: Impact Modal */}
          <Grid.Col
            span={3}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
            }}
          >
            <ImpactModal />
          </Grid.Col>
        </Grid>
      </Stack>
    </Box>
  );
}
