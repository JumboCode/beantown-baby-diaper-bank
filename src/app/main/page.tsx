"use client";

import dynamic from "next/dynamic";
import { Box, Stack, Title, Text, Paper } from "@mantine/core";
import TimelineSliderControls from "@/components/TimelineSliderControls";
import { useTimelinePeriod } from "@/components/useTimelinePeriod";
import TotalDiapersDistributed from "@/components/TotalDiapersDistributed";
import { useState, useEffect } from "react";
import ImpactModal from "@/components/ImpactModal";

const LeafletMap = dynamic(() => import("@/components/map/Map"), {
  ssr: false,
});

export default function Page() {
  const timeline = useTimelinePeriod(); 
  const [mapData, setMapData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string | undefined>(undefined);
  const [currentYear, setCurrentYear] = useState<string>("2025");

  const handleTimelineChange = async (params: { month?: string; year: string }) => {
    setLoading(true);
    setCurrentMonth(params.month);
    setCurrentYear(params.year);
    
    try {
      const queryParams = new URLSearchParams({
        year: params.year,
      });
      
      if (params.month) {
        queryParams.append("month", params.month);
      }
  
      const response = await fetch(`/api/cities?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch map data");
      }
  
      const data = await response.json();
      setMapData(data);
      
      console.log("Fetched data for:", params, data);
    } catch (error) {
      console.error("Error fetching map data:", error);
    } finally {
      setLoading(false);
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
  }, [timeline.view, timeline.index]);

  return (
    <Box p="xl" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Stack gap="xl" maw={1400} mx="auto">
        {/* Header */}
        <Box>
          <Title order={1} size="h2" fw={700} mb="xs">
            See where diapers are distributed
          </Title>
          <Text size="sm" c="dimmed">
            Last updated: Sep 9th, 2025.
          </Text>
        </Box>

        {/* Total Diapers Card */}
        <TotalDiapersDistributed month={currentMonth} year={currentYear} />

        {/* Map Section with Timeline and Impact Modal - Two Column Layout */}
        <Box style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "24px" }}>
          {/* Left Column: Map */}
          <Box>
            <Title order={2} size="h4" mb="md" fw={600}>
              Distribution Heat Map
            </Title>
            <Paper shadow="sm" p="md" radius="md" withBorder>
              <Box h="500px" pos="relative" mb="md">
                <LeafletMap 
                  view={timeline.view}
                  index={timeline.index}
                  labels={timeline.labels}
                  mapData={mapData}
                  loading={loading}
                />
              </Box>
              
              {/* Timeline Slider below map */}
              <TimelineSliderControls 
                {...timeline} 
                onTimelineChange={handleTimelineChange}
              />
            </Paper>
          </Box>

          {/* Right Column: Impact Modal */}
          <Box>
            <ImpactModal />
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
