"use client";

import { useState } from "react";
import {
  Modal,
  Stack,
  Text,
  Title,
  Divider,
  Group,
  Avatar,
  Tooltip,
} from "@mantine/core";
import { baseRegions, regionImpact, regionDetails } from "@/data/map-data";

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
        padding="xl"
        radius="md"
        withCloseButton={true}
        centered
      >
        {modalRegionDetails && modalRegionStats ? (
          <Stack gap="xs">
            <Title order={2} fw={700}>
              {modalRegionLabel}
            </Title>

            <Stack gap={4} mt="md">
              <Text size="lg" c="dimmed">
                Diapers Distributed:{" "}
                <Text component="span" c="black" fw={500}>
                  {modalRegionStats.diapersDelivered.toLocaleString()}
                </Text>
              </Text>
              <Text size="lg" c="dimmed">
                Children helped:{" "}
                <Text component="span" c="black" fw={500}>
                  {modalRegionStats.ChildrenServed.toLocaleString()}
                </Text>
              </Text>
            </Stack>

            <Title order={4} mt="xl" mb="xs">
              Partners
            </Title>

            {/* Horizontal list of small logos to match Figma */}
            <Group gap="sm">
              {modalRegionDetails.partners.map((partner) => (
                <Tooltip key={partner} label={partner} withArrow>
                  <Avatar
                    src={null} // Replace with partner.logoUrl when available
                    alt={partner}
                    radius="xl"
                    size="md"
                    color="red"
                    variant="light"
                  >
                    {/* Placeholder text initials like the "AT" in your screenshot */}
                    {partner.substring(0, 2).toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
            </Group>

            <Divider my="md" />

            <Title order={4}>Waitlisted Partner Information</Title>
            <Group gap="sm" mt="xs">
              {/* This matches the styling of the active partners above */}
              <Text size="sm" c="dimmed" fs="italic">
                No waitlisted partners at this time.
              </Text>
            </Group>
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">
            Select a region to explore detailed impact metrics.
          </Text>
        )}
      </Modal>

      <div className="w-full h-[100vh]">{/* Map logic would go here */}</div>
    </div>
  );
}
