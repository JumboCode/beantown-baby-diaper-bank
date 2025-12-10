"use client";

import { useState } from "react";
import {
  Modal,
  Stack,
  Text,
  Title,
  Mark,
  Divider,
  Accordion,
} from "@mantine/core";
import { baseRegions, regionImpact, regionDetails } from "@/data/map-data";
// import TimelineSliderControls from "@/components/TimelineSliderControls";

const findRegionFeature = (regionId: string | null | undefined) =>
  baseRegions.features.find((feature) => feature.properties?.id === regionId) ??
  null;

const getRegionName = (regionId: string | null | undefined) =>
  findRegionFeature(regionId)?.properties?.name ?? "None";

export default function MapPage() {
  const [modalRegionId, setModalRegionId] = useState<string | null>(null);

  const modalRegionStats = modalRegionId
    ? (regionImpact[modalRegionId] ?? null)
    : null;
  const modalRegionDetails = modalRegionId
    ? (regionDetails[modalRegionId] ?? null)
    : null;
  const modalRegionLabel = getRegionName(modalRegionId);
  const isModalOpen = modalRegionId != null;

  const handleModalClose = () => setModalRegionId(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Modal
        opened={isModalOpen}
        onClose={handleModalClose}
        size="lg"
        title={
          <Text inherit fw={600} fz={30}>
            Our impact in{" "}
            <Mark fw={800} color="clear" c="red" variant="light">
              {modalRegionLabel}
            </Mark>
          </Text>
        }
        centered
      >
        {modalRegionDetails && modalRegionStats ? (
          <Stack gap="md">
            <Text size="md">{modalRegionDetails.description}</Text>
            <Divider />
            <Title order={4}>Impact Metrics</Title>
            <Text size="sm">
              <Text component="span" fw={600}>
                {modalRegionStats.ChildrenServed.toLocaleString()}
              </Text>{" "}
              Children supported YTD
            </Text>
            <Text size="sm">
              <Text component="span" fw={600}>
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
                <Accordion.Item key={partner} value={partner}>
                  <Accordion.Control>{partner}</Accordion.Control>
                  <Accordion.Panel>
                    <Text size="sm">
                      Learn more about{" "}
                      <Text component="span" fw={600}>
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
          <Text size="sm" c="dimmed">
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
