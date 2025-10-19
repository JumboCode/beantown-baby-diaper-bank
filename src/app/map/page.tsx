"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Accordion,
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
  Mark,
} from "@mantine/core";
import { ExternalLink } from "lucide-react";
import LeafletMap from "@/components/map/LeafletMap";
import type { ChoroplethBucket } from "@/components/map/useRegionsLayer";
import type { PartnerSite, RegionsGeoJSON } from "@/lib/types";
import { resolvePartnerAddress } from "@/lib/util";
import { baseRegions } from "@/data/regions";
import {
  distributionSummary,
  partnerSites,
  regionImpact,
  regionDetails,
  impactAssumptions,
  type BasicPartnerSite,
} from "@/data/mapContent";
export type { BasicPartnerSite } from "@/data/mapContent";

const emptyRegions: RegionsGeoJSON = {
  type: "FeatureCollection",
  features: [],
};

type LegendBucket = ChoroplethBucket & { label: string };
const diaperLegendBuckets: LegendBucket[] = [
  { min: 0, max: 19999, color: "#e1f5f2", label: "0 – 20k diapers" },
  { min: 20000, max: 39999, color: "#7bdcb5", label: "20k – 40k diapers" },
  { min: 40000, max: Infinity, color: "#1a936f", label: "40k+ diapers" },
];

export default function MapPage() {
  const [showRegions, setShowRegions] = useState(true);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [hoveredRegionId, setHoveredRegionId] = useState<string | undefined>();
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState<number>(250);
  const [modalRegionId, setModalRegionId] = useState<string | null>(null);
  const [resolvedPartnerSites, setResolvedPartnerSites] = useState<
    PartnerSite[]
  >([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const resolved = await Promise.all(
        partnerSites.map((site) => resolvePartnerAddress(site))
      );
      if (mounted) {
        setResolvedPartnerSites(resolved);
      }
      console.log("RESOLVED PARTNER SITES", resolved);
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  const leftOverlay = (
    <Stack gap="md">
      {selectedRegionId ? (
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
            <Title order={3}>
              {" "}
              Our Impact in{" "}
              <Mark
                c="teal"
                variant="light"
                fz="inherit"
                bg="none">
                {activeRegionLabel}
              </Mark>
            </Title>
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
      ) : (
        <Paper
          radius="lg"
          shadow="xl"
          withBorder
          p="md">
          <Stack gap="sm">
            <Title order={4}>Our Impact</Title>
            <Text
              size="sm"
              c="dimmed">
              Select a region to see local distribution metrics.
            </Text>
          </Stack>
        </Paper>
      )}
      {/* <Paper
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
      </Paper> */}
    </Stack>
  );

  const rightOverlay = (
    <Accordion
      multiple
      radius="lg"
      variant="contained"
      defaultValue={[
        "impact-overview",
        "distribution-legend",
        "donation-impact",
      ]}>
      <Accordion.Item value="impact-overview">
        <Accordion.Control>
          <Group
            justify="space-between"
            align="center"
            w="100%">
            <Text fw={600}>Impact at a glance</Text>
            <Badge
              color="teal"
              variant="dot">
              +{distributionSummary.yoyGrowth}% YoY
            </Badge>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="sm">
            <Group
              align="center"
              gap="md">
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
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="distribution-legend">
        <Accordion.Control>
          <Text fw={600}>Distribution legend</Text>
        </Accordion.Control>
        <Accordion.Panel>
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
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="donation-impact">
        <Accordion.Control>
          <Group
            justify="space-between"
            align="center"
            w="100%">
            <Text fw={600}>Your impact</Text>
            <Badge
              color="teal"
              variant="light">
              ≈ ${impactAssumptions.diaperCost.toFixed(2)}/diaper
            </Badge>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="md">
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
              Assumes{" "}
              {Math.round(impactAssumptions.distributionEfficiency * 100)}% of
              funds reach diaper purchasing and delivery with{" "}
              {impactAssumptions.diapersPerChildPerWeek} diapers per child each
              week.
            </Text>
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
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
          partnerSites={resolvedPartnerSites}
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
