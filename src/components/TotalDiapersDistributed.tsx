"use client";

import { useEffect, useState } from "react";
import { Paper, Stack, Text, Group } from "@mantine/core";
import Image from "next/image";
// import ImpactModal from "./ImpactModal";

interface TotalDiapersProps {
  month?: string;
  year: string;
}

export default function TotalDiapersDistributed({ month, year }: TotalDiapersProps) {
  const [totalDiapers, setTotalDiapers] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTotalDiapers = async () => {
      setLoading(true);
      try {
        const url = `/api/total-diapers`;
        console.log("Fetching total diapers from:", url);

        const response = await fetch(url);

        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch total diapers: ${response.status}`);
        }

        const data = await response.json();
        console.log("Total diapers response:", data);
        
        // const diaper_total = 
        // fetch('https://api.example.com/data')

        const total = data.totalDiapers || data.total || data.sum || data.count || 0;
        console.log("Setting total diapers to:", total);
        
        setTotalDiapers(total);
      } catch (error) {
          console.error("Error fetching total diapers:", error);
          setTotalDiapers(0);
      } finally {
          setLoading(false);
      }
    };

    if (year) {
      fetchTotalDiapers();
    }
  }, [month, year]);

  return (
    <Paper
      shadow="md"
      p="lg"
      radius="md"
      style={{ backgroundColor: "#B8D4E8" }}
    >
      <Group justify="space-between" align="center">
        <Stack gap="xs">
          <Text size="sm" c="dimmed" fw={500}>
            Total Diapers Distributed
          </Text>
          <Text size="xl" fw={700}>
            {loading ? "..." : totalDiapers?.toLocaleString() || "0"}
          </Text>
        </Stack>
        <Image
          src="/diaper.svg"
          alt="Diaper icon"
          width={60}
          height={60}
        />
      </Group>
    </Paper>
  );
}
