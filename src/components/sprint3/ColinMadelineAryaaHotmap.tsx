"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Box,
  Divider,
  Group,
  Grid,
  List,
  Modal,
  Paper,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { ExternalLink } from "lucide-react";
import type { ChoroplethBucket } from "@/components/map/useRegionsLayer";
import type { RegionsGeoJSON } from "@/lib/types";
import LeafletMap from "./ColinMadelineAryaaLeafletMap";

const baseRegions: RegionsGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            // Start at the top-left lobe
            [-71.065544, 42.371427], // Left lobe outer edge
            [-71.064044, 42.372727], // Left lobe top curve (HIGHER)
            [-71.062044, 42.373427], // Left lobe peak (HIGHER)
            [-71.060544, 42.373427], // Left lobe inner (HIGHER)
            [-71.059544, 42.371427], // Center dip (stays same for deep crevice)
            [-71.058544, 42.373427], // Right lobe inner (HIGHER)
            [-71.057044, 42.373427], // Right lobe peak (HIGHER)
            [-71.055044, 42.372727], // Right lobe top curve (HIGHER)
            [-71.053544, 42.371427], // Right lobe outer edge
            [-71.053544, 42.369427], // Right side upper
            [-71.054544, 42.367427], // Right side middle
            [-71.056544, 42.365427], // Right side lower
            [-71.059544, 42.364427], // Bottom point
            [-71.062544, 42.365427], // Left side lower
            [-71.064544, 42.367427], // Left side middle
            [-71.065544, 42.369427], // Left side upper
            [-71.065544, 42.371427], // Close at left lobe outer edge
          ],
        ],
      },
      properties: {
        id: "downtown-boston",
        name: "Downtown Boston",
        centroid: [42.367427, -71.059544],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-71.0925, 42.352], // Left lobe outer edge (higher)
            [-71.0915, 42.3534], // Left lobe top curve
            [-71.089, 42.3542], // Left lobe peak
            [-71.088, 42.3541], // Left lobe inner
            [-71.0875, 42.3526], // Deep crevice between lobes (lower Y)
            [-71.087, 42.3541], // Right lobe inner
            [-71.086, 42.3542], // Right lobe peak
            [-71.0835, 42.3534], // Right lobe top curve
            [-71.0825, 42.352], // Right lobe outer edge
            [-71.082, 42.3505], // Right side upper
            [-71.083, 42.3485], // Right side lower
            [-71.0863, 42.3467], // Bottom right curve
            [-71.0875, 42.346], // Tip of heart
            [-71.0887, 42.3467], // Bottom left curve
            [-71.092, 42.3485], // Left side lower
            [-71.093, 42.3505], // Left side upper
            [-71.0925, 42.352],
          ],
        ],
      },
      properties: {
        id: "south-end",
        name: "South End",
        centroid: [42.3505, -71.0875],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-71.1115, 42.3602], // Left outer upper curve
            [-71.1104, 42.3615], // Left upper lobe peak
            [-71.1089, 42.3623], // Left inner upper curve
            [-71.1078, 42.361], // Left inner dip
            [-71.1072, 42.3595], // Center crevice (between lobes)
            [-71.1066, 42.361], // Right inner dip
            [-71.1055, 42.3623], // Right inner upper curve
            [-71.104, 42.3615], // Right upper lobe peak
            [-71.1029, 42.3602], // Right outer upper curve
            [-71.1025, 42.3586], // Right side down
            [-71.1034, 42.3571], // Right lower curve
            [-71.1052, 42.3562], // Lower right bottom curve
            [-71.1072, 42.3555], // Tip of heart
            [-71.1092, 42.3562], // Lower left bottom curve
            [-71.111, 42.3571], // Left lower curve
            [-71.1119, 42.3586], // Left side up
            [-71.1115, 42.3602], // Closing point
          ],
        ],
      },
      properties: {
        id: "cambridgeport",
        name: "Cambridgeport",
        centroid: [42.3588, -71.107],
      },
    },
  ],
};

const emptyRegions: RegionsGeoJSON = {
  type: "FeatureCollection",
  features: [],
};

const distributionSummary = {
  delivered: 82000,
  goal: 120000,
  ChildrenServed: 640,
  partnerCount: 22,
  yoyGrowth: 18,
};

const regionImpact: Record<
  string,
  {
    ChildrenServed: number;
    diapersDelivered: number;
    partnerSites: number;
    fulfillmentRate: number;
  }
> = {
  "downtown-boston": {
    ChildrenServed: 320,
    diapersDelivered: 42000,
    partnerSites: 11,
    fulfillmentRate: 0.86,
  },
  "south-end": {
    ChildrenServed: 210,
    diapersDelivered: 26000,
    partnerSites: 7,
    fulfillmentRate: 0.78,
  },
  cambridgeport: {
    ChildrenServed: 185,
    diapersDelivered: 23000,
    partnerSites: 6,
    fulfillmentRate: 0.81,
  },
};

const regionDetails: Record<
  string,
  {
    narrative: string;
    recentDeliveries: number;
    volunteerHours: number;
    topNeeds: string[];
    partners: string[];
    upcomingEvents: string[];
  }
> = {
  "downtown-boston": {
    narrative:
      "Our downtown partners coordinate weekly drop-ins for Children who rely on the MBTA. Demand grows 12% each quarter as more shelters refer caretakers to the hub.",
    recentDeliveries: 6800,
    volunteerHours: 240,
    topNeeds: ["Size 4 diapers", "Wipes", "Overnight pull-ups"],
    partners: [
      "City Shelter Collaborative",
      "Beacon Parenting Center",
      "Boston Health Alliance",
    ],
    upcomingEvents: [
      "Mar 2 – Pop-up pick-up at Government Center Plaza",
      "Apr 6 – Corporate employee sort-a-thon (200 volunteers)",
    ],
  },
  "south-end": {
    narrative:
      "South End pantries reach multilingual households; the mobile van stops at two community centers every Thursday. We’re piloting text-message reminders to reduce missed pickups.",
    recentDeliveries: 4100,
    volunteerHours: 180,
    topNeeds: ["Size 2 diapers", "Swim diapers", "Formula vouchers"],
    partners: [
      "South End Community Pantry",
      "Mosaic Family Hub",
      "Boston Medical outreach",
    ],
    upcomingEvents: [
      "Feb 28 – Mobile van + health screenings at Blackstone Square",
      "Mar 21 – Family essentials fair at Villa Victoria Center",
    ],
  },
};

type LegendBucket = ChoroplethBucket & { label: string };

const diaperLegendBuckets: LegendBucket[] = [
  { min: 0, max: 9999, color: "#90E0EF", label: "0 – 10k diapers" },
  { min: 10000, max: 19999, color: "#48CAE4", label: "10k – 20k diapers" },
  { min: 20000, max: 29999, color: "#00B4D8", label: "20k – 30k diapers" },
  { min: 30000, max: 39999, color: "#0077B6", label: "30k – 40k diapers" },
  { min: 40000, max: Infinity, color: "#023E8A", label: "40k+ diapers" },
];

const impactAssumptions = {
  diaperCost: 0.27, // average cost per diaper in USD
  distributionEfficiency: 0.92, // % of donation that goes directly to supplies & delivery
  diapersPerChildPerWeek: 50, // typical usage per child
};

export default function ColinMadelineAryaaHotmap() {
  // const [showRegions, setShowRegions] = useState(true);
  // const [regionFilter, setRegionFilter] = useState<string>("all");
  const [hoveredRegionId, setHoveredRegionId] = useState<string | undefined>();
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState<number>(250);
  const [modalRegionId, setModalRegionId] = useState<string | null>(null);

  const filteredRegions = useMemo<RegionsGeoJSON>(() => {
    if (!showRegions) {
      return emptyRegions;
    }
    if (regionFilter === "all") {
      return baseRegions;
    }

    return {
      ...baseRegions,
      features: baseRegions.features.filter(
        (feature) => feature.properties?.id === regionFilter,
      ),
    };
  }, [regionFilter, showRegions]);

  const diapersByRegion = useMemo<Record<string, number>>(() => {
    return baseRegions.features.reduce(
      (acc, feature) => {
        const regionId = feature.properties?.id;
        if (!regionId) {
          return acc;
        }
        const value = regionImpact[regionId]?.diapersDelivered ?? 0;
        acc[regionId] = value;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, []);

  const regionOptions = useMemo(
    () => [
      { value: "all", label: "All regions" },
      ...baseRegions.features.map((feature) => ({
        value: feature.properties?.id ?? "",
        label: feature.properties?.name ?? "Unnamed region",
      })),
    ],
    [],
  );

  const hoveredRegionName =
    baseRegions.features.find(
      (feature) => feature.properties?.id === hoveredRegionId,
    )?.properties?.name ?? "None";

  const selectedRegionName =
    baseRegions.features.find(
      (feature) => feature.properties?.id === selectedRegionId,
    )?.properties?.name ?? "None";

  const activeRegionId = selectedRegionId ?? hoveredRegionId ?? null;
  const activeRegionStats = activeRegionId
    ? (regionImpact[activeRegionId] ?? null)
    : null;

  const activeRegionLabel =
    baseRegions.features.find(
      (feature) => feature.properties?.id === activeRegionId,
    )?.properties?.name ?? "Select a region";

  const modalRegionStats = modalRegionId
    ? (regionImpact[modalRegionId] ?? null)
    : null;
  const modalRegionDetails = modalRegionId
    ? (regionDetails[modalRegionId] ?? null)
    : null;
  const modalRegionLabel =
    baseRegions.features.find(
      (feature) => feature.properties?.id === modalRegionId,
    )?.properties?.name ?? "Region detail";
  const isModalOpen = modalRegionId != null;

  const impactPercent = Math.min(
    100,
    Math.round(
      (distributionSummary.delivered / distributionSummary.goal) * 100,
    ),
  );

  const donationImpact = useMemo(() => {
    const amount = Math.max(0, donationAmount);
    const effectiveBudget = amount * impactAssumptions.distributionEfficiency;
    const diapersFunded = Math.floor(
      effectiveBudget / impactAssumptions.diaperCost,
    );
    const coverageWeeks = Math.floor(
      diapersFunded / impactAssumptions.diapersPerChildPerWeek,
    );
    const coverageMonths = coverageWeeks / 4;
    const ChildrenPerMonth = Math.max(
      0,
      Math.floor(
        diapersFunded / (impactAssumptions.diapersPerChildPerWeek * 4),
      ),
    );

    return {
      amount,
      diapersFunded,
      coverageWeeks,
      coverageMonths,
      ChildrenPerMonth,
    };
  }, [donationAmount]);

  const handleOpenRegionModal = () => {
    if (activeRegionId) {
      setModalRegionId(activeRegionId);
    }
  };

  const handleModalClose = () => {
    setModalRegionId(null);
  };

  const handleDonationSliderChange = (value: number) => {
    setDonationAmount(value);
  };

  const handleDonationInputChange = (value: number | string) => {
    if (value === "" || value == null) {
      setDonationAmount(0);
      return;
    }

    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.max(0, Math.min(5000, parsed));
      setDonationAmount(clamped);
    }
  };

  const coverageMonthsDisplay =
    donationImpact.coverageMonths >= 1
      ? donationImpact.coverageMonths.toFixed(1)
      : donationImpact.coverageMonths > 0
        ? donationImpact.coverageMonths.toFixed(2)
        : "0";

  // --- Leaderboard logic START ---
  const regionLeaderboard = useMemo(() => {
    // Array of regions sorted by ChildrenServed (descending)
    return Object.entries(regionImpact)
      .map(([regionId, stats]) => ({
        regionId,
        regionName:
          baseRegions.features.find((f) => f.properties?.id === regionId)
            ?.properties?.name ?? regionId,
        diapersDelivered: stats.diapersDelivered,
        ChildrenServed: stats.ChildrenServed,
      }))
      .sort((a, b) => b.ChildrenServed - a.ChildrenServed);
  }, []);
  // --- Leaderboard logic END ---

  const regionStories: Record<string, string> = {
    "downtown-boston":
      '"We thought we were prepared for everything, but newborn expenses added up fast. When the diaper bank delivered boxes right to our building, it felt like the city itself was looking out for us. It wasn\'t just diapers—it was hope, wrapped in kindness." - Ann',
    "south-end":
      '"When I lost my job during the winter, I had to make impossible choices—diapers or dinner. The South End Diaper Bank gave me relief I didn\'t even know I needed. For the first time in months, I could tuck my baby in at night without counting how many diapers I had left for tomorrow." - Jane',
    cambridgeport:
      "\“Twins mean double the joy—and double the diapers. When prices skyrocketed, the Downtown Diaper Bank became our lifeline. They reminded us that community still exists in this city. We’ll never forget that.\” - Eric",
  };

  const hoveredRegionStory =
    (hoveredRegionId && regionStories[hoveredRegionId]) || "";

  const leftOverlay = (
    <Stack gap="sm">
      <Paper
        radius="lg"
        shadow="xl"
        withBorder
        p="md"
        role="button"
        tabIndex={activeRegionStats ? 0 : -1}
        onClick={handleOpenRegionModal}
        onKeyDown={(event) => {
          if (!activeRegionStats) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleOpenRegionModal();
          }
        }}
        style={{
          cursor: activeRegionStats ? "pointer" : "default",
          outline: "none",
        }}
      >
        <Stack gap="sm">
          <Title order={4}>Region spotlight</Title>
          {activeRegionStats ? (
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <Text fw={600}>{activeRegionLabel}</Text>
                <Group gap="xs" align="center">
                  <Badge variant="light" color="teal">
                    Active
                  </Badge>
                  <ThemeIcon
                    variant="subtle"
                    color="teal"
                    radius="xl"
                    size={26}
                    aria-hidden
                  >
                    <ExternalLink size={16} />
                  </ThemeIcon>
                </Group>
              </Group>
              <Text size="sm">
                <Text component="span" fw={600}>
                  {activeRegionStats.ChildrenServed.toLocaleString()}
                </Text>{" "}
                Children supported
              </Text>
              <Text size="sm">
                <Text component="span" fw={600}>
                  {activeRegionStats.diapersDelivered.toLocaleString()}
                </Text>{" "}
                diapers delivered YTD
              </Text>
              <Text size="sm">
                Partner sites:{" "}
                <Text component="span" fw={600}>
                  {activeRegionStats.partnerSites}
                </Text>
              </Text>
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  Fulfillment rate
                </Text>
                <Progress
                  value={Math.round(activeRegionStats.fulfillmentRate * 100)}
                  color={
                    activeRegionStats.fulfillmentRate >= 0.85
                      ? "teal"
                      : "orange"
                  }
                  radius="xl"
                />
              </Stack>
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              Hover or click a region to see local distribution metrics.
            </Text>
          )}
        </Stack>
      </Paper>

      {/* start of the hover region impact story */}
      <Paper radius="lg" shadow="xl" withBorder p="md">
        <Stack gap={4}>
          <Title order={4} textWrap="wrap">
            {" "}
            {hoveredRegionName && hoveredRegionName !== "None"
              ? `Hear From The Voices In ${hoveredRegionName}`
              : "Pick a region to hear about the people that have been impacted there"}
          </Title>
          <Stack gap={0} mt="sm">
            <Text size="md" c="dimmed" mt={4}>
              {hoveredRegionStory}
            </Text>
          </Stack>
        </Stack>
      </Paper>
      {/* end of the hover region impact story */}
    </Stack>
  );

  const rightOverlay = (
    <Stack gap="md">
      <Paper radius="lg" shadow="xl" withBorder p="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <Title order={4}>Impact at a glance</Title>
            <Badge color="teal" variant="dot">
              +{distributionSummary.yoyGrowth}% YoY
            </Badge>
          </Group>
          <Group align="center" gap="md">
            <Stack gap={4}>
              <Text size="sm">
                <Text component="span" fw={700}>
                  {distributionSummary.delivered.toLocaleString()}
                </Text>{" "}
                diapers delivered
              </Text>
              <Text size="sm">
                <Text component="span" fw={700}>
                  {distributionSummary.ChildrenServed.toLocaleString()}
                </Text>{" "}
                Children served
              </Text>
              <Text size="sm">
                <Text component="span" fw={700}>
                  {distributionSummary.partnerCount}
                </Text>{" "}
                partner sites
              </Text>
            </Stack>
          </Group>
        </Stack>
      </Paper>

      {/* --- Leaderboard panel START --- */}
      <Paper radius="lg" shadow="xl" withBorder p="md">
        <Stack gap="sm">
          <Title order={4}>Region Leaderboard</Title>
          {regionLeaderboard.map((region, idx) => (
            <Group key={region.regionId} justify="space-between">
              <Text fw={600}>
                #{idx + 1} {region.regionName}
              </Text>
              <Badge color="teal" variant="light">
                {region.ChildrenServed.toLocaleString()} children
              </Badge>
            </Group>
          ))}
        </Stack>
      </Paper>
      {/* --- Leaderboard panel END --- */}

      <Paper radius="lg" shadow="xl" withBorder p="md">
        <Stack gap="sm">
          <Title order={4}>Distribution legend</Title>
          <Stack gap="xs">
            {diaperLegendBuckets.map((bucket) => (
              <Group key={bucket.label} justify="space-between" align="center">
                <Group gap="sm">
                  <Box
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      backgroundColor: bucket.color,
                    }}
                  />
                  <Text size="sm">{bucket.label}</Text>
                </Group>
                <Text size="xs" c="dimmed">
                  {bucket.max === Infinity
                    ? `${bucket.min.toLocaleString()}+`
                    : `${bucket.min.toLocaleString()}–${bucket.max.toLocaleString()}`}
                </Text>
              </Group>
            ))}
          </Stack>
        </Stack>
      </Paper>
      {/* ... rest of the rightOverlay ... */}
    </Stack>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Modal
        opened={isModalOpen}
        onClose={handleModalClose}
        size="lg"
        title={`${modalRegionLabel} impact`}
        centered
      >
        {modalRegionDetails && modalRegionStats ? (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              {modalRegionDetails.narrative}
            </Text>
            <Divider label="Snapshot" labelPosition="center" />
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">
                    Latest delivery
                  </Text>
                  <Text fw={700}>
                    {modalRegionDetails.recentDeliveries.toLocaleString()}{" "}
                    diapers
                  </Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">
                    Children helped
                  </Text>
                  <Text fw={700}>
                    {modalRegionStats.ChildrenServed.toLocaleString()}
                  </Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">
                    Volunteer hours
                  </Text>
                  <Text fw={700}>
                    {modalRegionDetails.volunteerHours.toLocaleString()}
                  </Text>
                </Stack>
              </Grid.Col>
            </Grid>
            <Divider label="Top needs" labelPosition="center" />
            <List spacing="xs" size="sm">
              {modalRegionDetails.topNeeds.map((need) => (
                <List.Item key={need}>{need}</List.Item>
              ))}
            </List>
            <Divider label="Key partners" labelPosition="center" />
            <List spacing="xs" size="sm">
              {modalRegionDetails.partners.map((partner) => (
                <List.Item key={partner}>{partner}</List.Item>
              ))}
            </List>
            <Divider label="Upcoming engagements" labelPosition="center" />
            <List spacing="xs" size="sm">
              {modalRegionDetails.upcomingEvents.map((event) => (
                <List.Item key={event}>{event}</List.Item>
              ))}
            </List>
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">
            Select a region to explore detailed impact metrics.
          </Text>
        )}
      </Modal>
      <div className="w-full h-[100vh]">
        <LeafletMap
          regions={filteredRegions}
          onRegionClick={(regionId) => {
            console.log("Region clicked:", regionId);
            setSelectedRegionId(regionId);
          }}
          onRegionHover={setHoveredRegionId}
          highlightedRegionId={activeRegionId}
          leftControls={leftOverlay}
          rightControls={rightOverlay}
          choroplethData={diapersByRegion}
          choroplethBuckets={diaperLegendBuckets}
        />
      </div>
    </div>
  );
}
