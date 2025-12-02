"use client";

import dynamic from "next/dynamic";
import { Box, Stack, Title, Text, Paper, Loader } from "@mantine/core";
import TimelineSliderControls from "@/components/TimelineSliderControls";
import { useTimelinePeriod } from "@/components/useTimelinePeriod";
import TotalDiapersDistributed from "@/components/TotalDiapersDistributed";
import { useState, useEffect } from "react";
import ImpactModal from "@/components/ImpactModal";
import { FeatureCollection, Point } from "geojson";
import { City, Distribution } from "@/generated/prisma/client";
import { Grid } from "@mantine/core";

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
  cities: { data: CityMapInfo[] };
};

export default function Page() {
  const timeline = useTimelinePeriod();
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [totalDiapers, setTotalDiapers] = useState<number>();

  const handleTimelineChange = async (params: {
    month?: string;
    year: string;
  }) => {
    try {
      const queryParams = new URLSearchParams({
        year: params.year,
      });

      if (params.month) {
        queryParams.append("month", params.month);
      }

      const [cities, centroids] = await Promise.all([
        fetch(`/api/cities?${queryParams.toString()}`).then((res) =>
          res.json()
        ),
        fetch(`/api/cities/centroids`).then((res) => res.json()),
      ]);

      setMapData({ centroids, cities });
    } catch (error) {
      console.error("Error fetching map data:", error);
    }
  };

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
    <Box style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Stack
        p="md"
        gap="xl"
        mx="auto">
        {/* Header */}
        <Box>
          <Title
            order={1}
            size="h2"
            fw={700}
            mb="xs">
            See where diapers are distributed
          </Title>
          <Text
            size="sm"
            c="dimmed">
            Last updated: Sep 9th, 2025.
          </Text>
        </Box>

        {/* Total Diapers Card */}
        {totalDiapers ? (
          <TotalDiapersDistributed totalDiapers={totalDiapers} />
        ) : (
          <Loader />
        )}

        {/* Map Section with Timeline and Impact Modal - Two Column Layout */}
        <Grid align="flex-end">
          {/* Left Column: Map */}
          <Grid.Col span="auto">
            <Title
              order={2}
              size="h4"
              mb="md"
              fw={600}>
              Distribution Heat Map
            </Title>
            <Paper
              shadow="sm"
              p="md"
              radius="md"
              withBorder>
              <Box
                h="50vh"
                pos="relative"
                mb="md">
                <LeafletMap
                  view={timeline.view}
                  index={timeline.index}
                  labels={timeline.labels}
                  mapData={mapData}
                />
              </Box>

              {/* Timeline Slider below map */}
              <TimelineSliderControls
                {...timeline}
                onTimelineChange={handleTimelineChange}
              />
            </Paper>
          </Grid.Col>

          {/* Right Column: Impact Modal */}
          <Grid.Col span={4}>
            <ImpactModal />
          </Grid.Col>
        </Grid>
      </Stack>
    </Box>
  );
}
