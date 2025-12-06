"use client";

import { useState } from "react";
import {
  Badge,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Mark,
  Divider,
  Accordion,
} from "@mantine/core";
import { ExternalLink } from "lucide-react";
import { baseRegions, regionImpact, regionDetails } from "@/data/map-data";
import dynamic from "next/dynamic";
// import TimelineSliderControls from "@/components/TimelineSliderControls";
import { useTimelinePeriod } from "@/components/useTimelinePeriod";

const LeafletMap = dynamic(
  () => import("@/components/map/Map").then((module) => module.default),
  { ssr: false }
);

const findRegionFeature = (regionId: string | null | undefined) =>
  baseRegions.features.find((feature) => feature.properties?.id === regionId) ??
  null;

const getRegionName = (regionId: string | null | undefined) =>
  findRegionFeature(regionId)?.properties?.name ?? "None";

export default function MapPage() {
  const timeline = useTimelinePeriod(); // { view, index, setIndex, toggleView, move, length }
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [modalRegionId, setModalRegionId] = useState<string | null>(null);

  const activeRegionId = selectedRegionId ?? null;
  const activeRegionStats = activeRegionId
    ? (regionImpact[activeRegionId] ?? null)
    : null;

  const activeRegionLabel = getRegionName(activeRegionId);

  const modalRegionStats = modalRegionId
    ? (regionImpact[modalRegionId] ?? null)
    : null;
  const modalRegionDetails = modalRegionId
    ? (regionDetails[modalRegionId] ?? null)
    : null;
  const modalRegionLabel = getRegionName(modalRegionId);
  const isModalOpen = modalRegionId != null;

  const handleOpenRegionModal = () => {
    if (activeRegionId) {
      setModalRegionId(activeRegionId);
    }
  };

  const handleModalClose = () => setModalRegionId(null);

  const leftOverlay = (
    <Paper
      radius="lg"
      shadow="xl"
      withBorder
      p="md"
      role="button" // provide aria role for accessibility
      onClick={handleOpenRegionModal}
      style={{
        cursor: activeRegionStats ? "pointer" : "default",
        outline: "none",
      }}>
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={4}>Region spotlight</Title>
          {activeRegionStats && (
            <ThemeIcon
              variant="subtle"
              color="teal"
              radius="xl"
              size={26}
              aria-hidden>
              <ExternalLink size={16} />
            </ThemeIcon>
          )}
        </Group>
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
          </Stack>
        ) : (
          <Text
            size="sm"
            c="dimmed">
            Click a region to see local distribution metrics.
          </Text>
        )}
      </Stack>
    </Paper>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Modal
        opened={isModalOpen}
        onClose={handleModalClose}
        size="lg"
        title={
          <Text
            inherit
            fw={600}
            fz={30}>
            Our impact in{" "}
            <Mark
              fw={800}
              color="clear"
              c="red"
              variant="light">
              {modalRegionLabel}
            </Mark>
          </Text>
        }
        centered>
        {modalRegionDetails && modalRegionStats ? (
          <Stack gap="md">
            <Text size="md">{modalRegionDetails.description}</Text>
            <Divider />
            <Title order={4}>Impact Metrics</Title>
            <Text size="sm">
              <Text
                component="span"
                fw={600}>
                {modalRegionStats.ChildrenServed.toLocaleString()}
              </Text>{" "}
              Children supported YTD
            </Text>
            <Text size="sm">
              <Text
                component="span"
                fw={600}>
                {modalRegionStats.diapersDelivered.toLocaleString()}
              </Text>{" "}
              diapers delivered YTD
            </Text>
            <Divider />
            <Title order={4}>
              {modalRegionLabel}&apos;s Partner Organizations
            </Title>
            <Accordion>
              {modalRegionDetails.partners.map((partner) => (
                <Accordion.Item
                  key={partner}
                  value={partner}>
                  <Accordion.Control>{partner}</Accordion.Control>
                  <Accordion.Panel>
                    <Text size="sm">
                      Learn more about{" "}
                      <Text
                        component="span"
                        fw={600}>
                        {partner}
                      </Text>
                      &apos;s work in the community.
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
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
        {/* <LeafletMap
        // view={timeline.view}
        // index={timeline.index}
        // labels={timeline.labels}
        // regions={baseRegions}
        // onRegionClick={setSelectedRegionId}
        // leftControls={leftOverlay}
        />
        <TimelineSliderControls {...timeline} /> */}
      </div>
    </div>
  );
}
