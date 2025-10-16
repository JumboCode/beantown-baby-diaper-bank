"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  Grid,
  List,
  NumberInput,
  Modal,
  Paper,
  Progress,
  Select,
  Slider,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { ExternalLink } from "lucide-react";
import LeafletMap from "@/components/map/LeafletMap";
import type { ChoroplethBucket } from "@/components/map/useRegionsLayer";
import type { RegionsGeoJSON } from "@/lib/types";

const baseRegions: RegionsGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-71.064544, 42.362427],
            [-71.054544, 42.362427],
            [-71.054544, 42.372427],
            [-71.064544, 42.372427],
            [-71.064544, 42.362427],
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
            [-71.095, 42.345],
            [-71.08, 42.345],
            [-71.08, 42.355],
            [-71.095, 42.355],
            [-71.095, 42.345],
          ],
        ],
      },
      properties: {
        id: "south-end",
        name: "South End",
        centroid: [42.3505, -71.0875],
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
  { min: 0, max: 19999, color: "#e1f5f2", label: "0 – 20k diapers" },
  { min: 20000, max: 39999, color: "#7bdcb5", label: "20k – 40k diapers" },
  { min: 40000, max: Infinity, color: "#1a936f", label: "40k+ diapers" },
];

const impactAssumptions = {
  diaperCost: 0.27, // average cost per diaper in USD
  distributionEfficiency: 0.92, // % of donation that goes directly to supplies & delivery
  diapersPerChildPerWeek: 50, // typical usage per child
};

export default function MapPage() {
  const [showRegions, setShowRegions] = useState(true);
  const [regionFilter, setRegionFilter] = useState<string>("all");
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
        (feature) => feature.properties?.id === regionFilter
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
      {} as Record<string, number>
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
    []
  );

  const hoveredRegionName =
    baseRegions.features.find(
      (feature) => feature.properties?.id === hoveredRegionId
    )?.properties?.name ?? "None";

  const selectedRegionName =
    baseRegions.features.find(
      (feature) => feature.properties?.id === selectedRegionId
    )?.properties?.name ?? "None";

  const activeRegionId = selectedRegionId ?? hoveredRegionId ?? null;
  const activeRegionStats = activeRegionId
    ? (regionImpact[activeRegionId] ?? null)
    : null;

  const activeRegionLabel =
    baseRegions.features.find(
      (feature) => feature.properties?.id === activeRegionId
    )?.properties?.name ?? "Select a region";

  const modalRegionStats = modalRegionId
    ? (regionImpact[modalRegionId] ?? null)
    : null;
  const modalRegionDetails = modalRegionId
    ? (regionDetails[modalRegionId] ?? null)
    : null;
  const modalRegionLabel =
    baseRegions.features.find(
      (feature) => feature.properties?.id === modalRegionId
    )?.properties?.name ?? "Region detail";
  const isModalOpen = modalRegionId != null;

  const impactPercent = Math.min(
    100,
    Math.round((distributionSummary.delivered / distributionSummary.goal) * 100)
  );

  const donationImpact = useMemo(() => {
    const amount = Math.max(0, donationAmount);
    const effectiveBudget = amount * impactAssumptions.distributionEfficiency;
    const diapersFunded = Math.floor(
      effectiveBudget / impactAssumptions.diaperCost
    );
    const coverageWeeks = Math.floor(
      diapersFunded / impactAssumptions.diapersPerChildPerWeek
    );
    const coverageMonths = coverageWeeks / 4;
    const ChildrenPerMonth = Math.max(
      0,
      Math.floor(diapersFunded / (impactAssumptions.diapersPerChildPerWeek * 4))
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

  const leftOverlay = (
    <Stack gap="md">
      <Paper
        radius="lg"
        shadow="xl"
        withBorder
        p="md">
        <Stack gap="sm">
          <Title order={4}>Map Controls</Title>
          <Checkbox
            label="Show regions"
            checked={showRegions}
            onChange={(event) => setShowRegions(event.currentTarget.checked)}
          />
          <Select
            label="Focus region"
            placeholder="All regions"
            data={regionOptions}
            value={regionFilter}
            onChange={(value) => setRegionFilter(value ?? "all")}
            disabled={!showRegions}
          />
          <Stack
            gap={0}
            mt="sm">
            <Text
              size="sm"
              c="dimmed">
              Hovering:
            </Text>
            <Badge
              color="teal"
              variant="light">
              {hoveredRegionName}
            </Badge>
          </Stack>
          <Stack gap={0}>
            <Text
              size="sm"
              c="dimmed">
              Last clicked:
            </Text>
            <Badge
              color="blue"
              variant="light">
              {selectedRegionName}
            </Badge>
          </Stack>
          <Group
            justify="flex-end"
            mt="sm">
            <Button
              variant="subtle"
              size="xs"
              onClick={() => {
                setRegionFilter("all");
                setSelectedRegionId(null);
              }}>
              Reset
            </Button>
          </Group>
        </Stack>
      </Paper>

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
        }}>
        <Stack gap="sm">
          <Title order={4}>Region spotlight</Title>
          {activeRegionStats ? (
            <Stack gap="xs">
              <Group
                justify="space-between"
                align="center">
                <Text fw={600}>{activeRegionLabel}</Text>
                <Group
                  gap="xs"
                  align="center">
                  <Badge
                    variant="light"
                    color="teal">
                    Active
                  </Badge>
                  <ThemeIcon
                    variant="subtle"
                    color="teal"
                    radius="xl"
                    size={26}
                    aria-hidden>
                    <ExternalLink size={16} />
                  </ThemeIcon>
                </Group>
              </Group>
              <Text size="sm">
                <Text
                  component="span"
                  fw={600}>
                  {activeRegionStats.ChildrenServed.toLocaleString()}
                </Text>{" "}
                Children supported
              </Text>
              <Text size="sm">
                <Text
                  component="span"
                  fw={600}>
                  {activeRegionStats.diapersDelivered.toLocaleString()}
                </Text>{" "}
                diapers delivered YTD
              </Text>
              <Text size="sm">
                Partner sites:{" "}
                <Text
                  component="span"
                  fw={600}>
                  {activeRegionStats.partnerSites}
                </Text>
              </Text>
              <Stack gap={4}>
                <Text
                  size="xs"
                  c="dimmed">
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
            <Text
              size="sm"
              c="dimmed">
              Hover or click a region to see local distribution metrics.
            </Text>
          )}
        </Stack>
      </Paper>
    </Stack>
  );

  const rightOverlay = (
    <Stack gap="md">
      <Paper
        radius="lg"
        shadow="xl"
        withBorder
        p="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <Title order={4}>Impact at a glance</Title>
            <Badge
              color="teal"
              variant="dot">
              +{distributionSummary.yoyGrowth}% YoY
            </Badge>
          </Group>
          <Group
            align="center"
            gap="md">
            {/* <RingProgress
              size={120}
              thickness={12}
              label={
                <Stack
                  gap={0}
                  align="center">
                  <Text
                    size="xs"
                    c="dimmed">
                    Goal progress
                  </Text>
                  <Text fw={700}>{impactPercent}%</Text>
                </Stack>
              }
              sections={[
                {
                  value: impactPercent,
                  color: "teal",
                },
              ]}
            /> */}
            <Stack gap={4}>
              <Text size="sm">
                <Text
                  component="span"
                  fw={700}>
                  {distributionSummary.delivered.toLocaleString()}
                </Text>{" "}
                diapers delivered
              </Text>
              <Text size="sm">
                <Text
                  component="span"
                  fw={700}>
                  {distributionSummary.ChildrenServed.toLocaleString()}
                </Text>{" "}
                Children served
              </Text>
              <Text size="sm">
                <Text
                  component="span"
                  fw={700}>
                  {distributionSummary.partnerCount}
                </Text>{" "}
                partner sites
              </Text>
            </Stack>
          </Group>
          {/* <Divider />
          <Stack gap={4}>
            <Text
              size="xs"
              c="dimmed">
              Annual goal
            </Text>
            <Progress
              value={impactPercent}
              color="teal"
              radius="xl"
            />
          </Stack> */}
        </Stack>
      </Paper>

      <Paper
        radius="lg"
        shadow="xl"
        withBorder
        p="md">
        <Stack gap="sm">
          <Title order={4}>Distribution legend</Title>
          <Stack gap="xs">
            {diaperLegendBuckets.map((bucket) => (
              <Group
                key={bucket.label}
                justify="space-between"
                align="center">
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
                <Text
                  size="xs"
                  c="dimmed">
                  {bucket.max === Infinity
                    ? `${bucket.min.toLocaleString()}+`
                    : `${bucket.min.toLocaleString()}–${bucket.max.toLocaleString()}`}
                </Text>
              </Group>
            ))}
          </Stack>
        </Stack>
      </Paper>

      <Paper
        radius="lg"
        shadow="xl"
        withBorder
        p="md">
        <Stack gap="md">
          <Group
            justify="space-between"
            align="center">
            <Title order={4}>Your impact</Title>
            <Badge
              color="teal"
              variant="light">
              ≈ ${impactAssumptions.diaperCost.toFixed(2)}/diaper
            </Badge>
          </Group>
          <Text
            size="sm"
            c="dimmed">
            Estimate how far a contribution travels through our distribution
            network.
          </Text>
          <Stack gap="md">
            <Slider
              value={donationAmount}
              onChange={handleDonationSliderChange}
              min={5}
              max={100}
              step={5}
              marks={[
                { value: 5, label: "$5" },
                { value: 50, label: "$50" },
                { value: 100, label: "$100" },
              ]}
              label={(value) => `$${value}`}
              color="teal"
            />
            <NumberInput
              label="Donation amount"
              prefix="$ "
              min={0}
              max={5000}
              step={25}
              value={donationAmount}
              onChange={handleDonationInputChange}
              allowDecimal={false}
              clampBehavior="strict"
            />
          </Stack>
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Stack gap={2}>
                <Text
                  size="xs"
                  c="dimmed">
                  Diapers funded
                </Text>
                <Text fw={700}>
                  {donationImpact.diapersFunded.toLocaleString()}
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Stack gap={2}>
                <Text
                  size="xs"
                  c="dimmed">
                  Weeks of care
                </Text>
                <Text fw={700}>
                  {donationImpact.coverageWeeks.toLocaleString()}
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Stack gap={2}>
                <Text
                  size="xs"
                  c="dimmed">
                  Children/month supported
                </Text>
                <Text fw={700}>
                  {donationImpact.ChildrenPerMonth.toLocaleString()}
                </Text>
              </Stack>
            </Grid.Col>
          </Grid>

          <Text
            size="xs"
            c="dimmed">
            Assumes {Math.round(impactAssumptions.distributionEfficiency * 100)}
            % of funds reach diaper purchasing and delivery with{" "}
            {impactAssumptions.diapersPerChildPerWeek} diapers per child each
            week.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Modal
        opened={isModalOpen}
        onClose={handleModalClose}
        size="lg"
        title={`${modalRegionLabel} impact`}
        centered>
        {modalRegionDetails && modalRegionStats ? (
          <Stack gap="md">
            <Text
              size="sm"
              c="dimmed">
              {modalRegionDetails.narrative}
            </Text>
            <Divider
              label="Snapshot"
              labelPosition="center"
            />
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Stack gap={2}>
                  <Text
                    size="xs"
                    c="dimmed">
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
                  <Text
                    size="xs"
                    c="dimmed">
                    Children helped
                  </Text>
                  <Text fw={700}>
                    {modalRegionStats.ChildrenServed.toLocaleString()}
                  </Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Stack gap={2}>
                  <Text
                    size="xs"
                    c="dimmed">
                    Volunteer hours
                  </Text>
                  <Text fw={700}>
                    {modalRegionDetails.volunteerHours.toLocaleString()}
                  </Text>
                </Stack>
              </Grid.Col>
            </Grid>
            <Divider
              label="Top needs"
              labelPosition="center"
            />
            <List
              spacing="xs"
              size="sm">
              {modalRegionDetails.topNeeds.map((need) => (
                <List.Item key={need}>{need}</List.Item>
              ))}
            </List>
            <Divider
              label="Key partners"
              labelPosition="center"
            />
            <List
              spacing="xs"
              size="sm">
              {modalRegionDetails.partners.map((partner) => (
                <List.Item key={partner}>{partner}</List.Item>
              ))}
            </List>
            <Divider
              label="Upcoming engagements"
              labelPosition="center"
            />
            <List
              spacing="xs"
              size="sm">
              {modalRegionDetails.upcomingEvents.map((event) => (
                <List.Item key={event}>{event}</List.Item>
              ))}
            </List>
          </Stack>
        ) : (
          <Text
            size="sm"
            c="dimmed">
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
