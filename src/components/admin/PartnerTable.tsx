"use client";

import { useState } from "react";
import {
  Accordion,
  Modal,
  Pill,
  Mark,
  Text,
  Loader,
  Center,
  ScrollArea,
  Group,
  Badge,
  ActionIcon,
  Grid,
  Card,
  Tooltip,
} from "@mantine/core";
import EditPartnerForm from "./EditPartnerForm";
import { useDisclosure } from "@mantine/hooks";
import { status } from "@/generated/prisma/enums";
import Image from "next/image";
export type Partner = {
  id: number;
  created_at: string;
  name: string;
  description: string | null;
  start_partner: string | null;
  end_partner?: string;
  status: status;
  address: string | null;
  coords?: { lat: number; lng: number };
  logoUrl: string | null;
};

function formatDate(rawDate: string) {
  const date = new Date(rawDate);

  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatPercentDisplay(value: number | null | undefined) {
  if (value == null) return null;
  const rounded = Number((value * 100).toFixed(4)); // round to 4 decimal places, drop trailing zeros
  return `${rounded}%`;
}

type PartnerRegion = {
  partnerId: number;
  cityId: number;
  percentage: number | null;
  city: {
    id: number;
    name: string;
  };
};

export default function PartnerTable({
  partners,
  percentages,
  refreshTable,
  loading = false,
}: {
  partners: Partner[];
  percentages: PartnerRegion[];
  refreshTable?: () => void;
  loading?: boolean;
}) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <ScrollArea className="flex-1" type="auto" offsetScrollbars>
        <Card withBorder>
          <Grid columns={11} gutter="sm" align="center">
            <Grid.Col span={4}>
              <Text size="sm" fw={500}>
                Partner Name
              </Text>
            </Grid.Col>
            <Grid.Col span={2}>
              <Text size="sm" fw={500}>
                Since
              </Text>
            </Grid.Col>
            <Grid.Col span={2}>
              <Text size="sm" fw={500}>
                Cities Served
              </Text>
            </Grid.Col>
            <Grid.Col span={2} ta="center">
              <Text size="sm" fw={500}>
                Status
              </Text>
            </Grid.Col>
            <Grid.Col span={1}></Grid.Col>
          </Grid>
        </Card>

        {loading ? (
          <Center py="xl">
            <Loader type="bars" />
          </Center>
        ) : (
          <Accordion variant="default" radius={0}>
            {[...partners]
              .sort((a, b) => {
                if (a.status === "active" && b.status !== "active") return -1;
                if (a.status !== "active" && b.status === "active") return 1;
                const dateA = a.start_partner ? new Date(a.start_partner).getTime() : Infinity;
                const dateB = b.start_partner ? new Date(b.start_partner).getTime() : Infinity;
                return dateA - dateB;
              })
              .map((partner) => {
                const partnerPercentages = percentages
                  .filter((percentage) => Number(percentage.partnerId) === partner.id)
                  .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0));

                return (
                  <Accordion.Item key={partner.id} value={partner.id.toString()}>
                    <Accordion.Control>
                      <Grid columns={11} gutter="sm" align="center">
                        <Grid.Col span={4}>
                          <div className="flex items-center gap-3">
                            {partner.logoUrl && (
                              <img
                                src={partner.logoUrl}
                                alt={partner.name}
                                className="h-10 w-10 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            )}
                            <Text c="#101828" fw={600} fz={"16px"} truncate>
                              {partner.name}
                            </Text>
                          </div>
                        </Grid.Col>

                        <Grid.Col span={2}>
                          {partner.start_partner ? (
                            <Text size="sm" c="dimmed">
                              {formatDate(partner.start_partner)}
                            </Text>
                          ) : (
                            <Text size="sm" c="dimmed" fs="italic">
                              N/A
                            </Text>
                          )}
                        </Grid.Col>

                        <Grid.Col span={2}>
                          <Text size="sm" fw={500} c="dimmed">
                            {partnerPercentages.length}{" "}
                            {partnerPercentages.length === 1 ? "City" : "Cities"}
                          </Text>
                        </Grid.Col>

                        <Grid.Col span={2}>
                          <Group justify="center">
                            <Pill
                              ta="center"
                              px="sm"
                              radius="sm"
                              fw="bold"
                              c="white"
                              fz="10px"
                              bg={
                                partner.status === "active"
                                  ? "#558D22"
                                  : partner.status === "inactive"
                                    ? "#E2383F"
                                    : "#98A2B3"
                              }
                            >
                              {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                            </Pill>
                          </Group>
                        </Grid.Col>

                        <Grid.Col span={1}>
                          <Tooltip label="Edit Partner">
                            <ActionIcon
                              variant="subtle"
                              size="md"
                              color="#14215A"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPartner(partner);
                                open();
                              }}
                            >
                              <Image src="/admin_view/pen.svg" alt="Edit" width={16} height={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Grid.Col>
                      </Grid>
                    </Accordion.Control>

                    <Accordion.Panel>
                      <Grid gutter="xl">
                        <Grid.Col span={12}>
                          <Text size="sm" fw={600} mb={8} c="#101828">
                            Description
                          </Text>
                          <Text size="sm" c="dimmed" lh={1.6}>
                            {partner.description || "No description provided."}
                          </Text>
                        </Grid.Col>
                        <Grid.Col span={3}>
                          <Text size="sm" fw={600} mb={8} c="#101828">
                            Address
                          </Text>
                          <Text size="sm" c="dimmed" lh={1.6}>
                            {partner.address || "No address provided."}
                          </Text>
                        </Grid.Col>
                        <Grid.Col span={9}>
                          <Text size="sm" fw={600} mb={8} c="#101828">
                            All Cities Served ({partnerPercentages.length})
                          </Text>
                          <Group gap="xs">
                            {partnerPercentages.length > 0 ? (
                              partnerPercentages.map((p) => (
                                <Badge
                                  key={p.cityId}
                                  variant="light"
                                  color="blue"
                                  radius="sm"
                                  fw={500}
                                  tt="none"
                                >
                                  {partner.status !== "waitlisted" && p.percentage != null
                                    ? `${p.city.name} (${formatPercentDisplay(p.percentage)})`
                                    : p.city.name}
                                </Badge>
                              ))
                            ) : (
                              <Text size="sm" fs="italic" c="dimmed">
                                None
                              </Text>
                            )}
                          </Group>
                        </Grid.Col>
                      </Grid>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
          </Accordion>
        )}
      </ScrollArea>

      {partner && (
        <Modal
          opened={opened}
          title={
            <Text fw={700} fz={30} c="#101828" ml="xl">
              Edit{" "}
              <Mark bg="none" c="#053766">
                {partner.name}
              </Mark>{" "}
              Partner Information
            </Text>
          }
          onClose={() => setPartner(null)}
          size="75%"
          centered
        >
          <EditPartnerForm
            partner={partner}
            onClose={() => {
              close();
              setPartner(null);
              refreshTable?.();
            }}
          />
        </Modal>
      )}
    </>
  );
}
