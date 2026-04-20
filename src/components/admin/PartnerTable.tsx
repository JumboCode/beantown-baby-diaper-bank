"use client";

import { useState } from "react";
import {
  Accordion,
  Modal,
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
  Stack,
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
  num_babies: number | null;
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
      <Card
        withBorder
        radius="md"
        p={0}
        shadow="sm"
        className="flex flex-col flex-1 border-gray-200 bg-white overflow-hidden"
      >
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 top-0 z-10 sticky">
          <Grid columns={13} gutter="sm" align="center">
            <Grid.Col span={4}>
              <Text
                size="xs"
                fw={600}
                c="var(--color-brand)"
                tt="uppercase"
                style={{ letterSpacing: "0.05em" }}
              >
                Partner Name
              </Text>
            </Grid.Col>
            <Grid.Col span={2}>
              <Text
                size="xs"
                fw={600}
                c="var(--color-brand)"
                tt="uppercase"
                style={{ letterSpacing: "0.05em" }}
              >
                Since
              </Text>
            </Grid.Col>
            <Grid.Col span={2}>
              <Text
                size="xs"
                fw={600}
                c="var(--color-brand)"
                tt="uppercase"
                style={{ letterSpacing: "0.05em" }}
              >
                Cities Served
              </Text>
            </Grid.Col>
            <Grid.Col span={2}>
              <Text
                size="xs"
                fw={600}
                c="var(--color-brand)"
                tt="uppercase"
                style={{ letterSpacing: "0.05em" }}
              >
                Babies / Month
              </Text>
            </Grid.Col>
            <Grid.Col span={2} ta="center">
              <Text
                size="xs"
                fw={600}
                c="var(--color-brand)"
                tt="uppercase"
                style={{ letterSpacing: "0.05em" }}
              >
                Status
              </Text>
            </Grid.Col>
            <Grid.Col span={1} />
          </Grid>
        </div>
        <ScrollArea h="68vh">
          {loading ? (
            <Center py="xl">
              <Loader type="bars" />
            </Center>
          ) : (
            <Accordion
              variant="filled"
              radius={0}
              chevronPosition="right"
              order={3}
              classNames={{
                item: "border-b border-gray-200 last:border-b-0 bg-white overflow-hidden",
                control: "hover:bg-gray-50/50 transition-colors duration-200 px-6 py-4",
                panel: "bg-gray-50/50 border-t border-gray-100",
                // content: "p-6",
              }}
            >
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
                      <div style={{ position: "relative" }}>
                        <Accordion.Control>
                          <Grid columns={13} gutter="sm" align="center">
                            <Grid.Col span={4}>
                              <div className="flex items-center gap-3">
                                {partner.logoUrl ? (
                                  <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-white shadow-sm">
                                    <img
                                      src={partner.logoUrl}
                                      alt={partner.name}
                                      className="h-full w-full object-contain p-1"
                                      onError={(e) => {
                                        e.currentTarget.parentElement!.style.display = "none";
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="h-10 w-10 flex-shrink-0 rounded-full border border-gray-200 bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-500 text-sm font-bold shadow-sm">
                                    {partner.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <Text c="var(--color-text-heading)" fw={600} fz="sm" truncate>
                                  {partner.name}
                                </Text>
                              </div>
                            </Grid.Col>

                            <Grid.Col span={2}>
                              <Text size="sm" c="var(--color-text-secondary)">
                                {partner.start_partner ? (
                                  formatDate(partner.start_partner)
                                ) : (
                                  <Text size="sm" c="dimmed" fs="italic" span>
                                    —
                                  </Text>
                                )}
                              </Text>
                            </Grid.Col>

                            <Grid.Col span={2}>
                              <Text size="sm" c="var(--color-text-secondary)" fw={500}>
                                {partnerPercentages.length}{" "}
                                <Text span c="dimmed" fw={400}>
                                  {partnerPercentages.length === 1 ? "city" : "cities"}
                                </Text>
                              </Text>
                            </Grid.Col>

                            <Grid.Col span={2}>
                              <Text size="sm" c="var(--color-text-secondary)" fw={500}>
                                {partner.num_babies != null ? (
                                  partner.num_babies.toLocaleString()
                                ) : (
                                  <Text size="sm" c="dimmed" fs="italic" span>
                                    —
                                  </Text>
                                )}
                              </Text>
                            </Grid.Col>

                            <Grid.Col span={2}>
                              <Group justify="center">
                                <Badge
                                  color={
                                    partner.status === "active"
                                      ? "brand"
                                      : partner.status === "inactive"
                                        ? "brandRed"
                                        : "gray"
                                  }
                                  variant="light"
                                  size="md"
                                  radius="xl"
                                  fw={600}
                                  styles={{ label: { textTransform: "capitalize" } }}
                                >
                                  {partner.status}
                                </Badge>
                              </Group>
                            </Grid.Col>

                            <Grid.Col span={1}>
                              <Group justify="flex-end">
                                <div style={{ width: 28, height: 28 }} />
                              </Group>
                            </Grid.Col>
                          </Grid>
                        </Accordion.Control>

                        <div
                          style={{
                            position: "absolute",
                            right: "52px",
                            top: 0,
                            bottom: 0,
                            display: "flex",
                            alignItems: "center",
                            zIndex: 2,
                          }}
                        >
                          <Tooltip label="Edit Partner" withArrow closeDelay={0}>
                            <ActionIcon
                              variant="subtle"
                              size="lg"
                              color="gray"
                              radius="xl"
                              className="hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPartner(partner);
                                open();
                              }}
                            >
                              <Image
                                src="/admin_view/pen.svg"
                                alt="Edit"
                                width={18}
                                height={18}
                                style={{ opacity: 0.6 }}
                              />
                            </ActionIcon>
                          </Tooltip>
                        </div>
                      </div>

                      <Accordion.Panel>
                        <Grid gutter="xl">
                          <Grid.Col span={12} pb={0}>
                            <Stack gap={6}>
                              <Text
                                size="xs"
                                fw={600}
                                c="var(--color-brand)"
                                tt="uppercase"
                                style={{ letterSpacing: "0.05em" }}
                              >
                                Description
                              </Text>
                              <Text size="sm" c="var(--color-text-secondary)" lh={1.6}>
                                {partner.description || (
                                  <Text size="sm" c="dimmed" fs="italic" span>
                                    No description provided.
                                  </Text>
                                )}
                              </Text>
                            </Stack>
                          </Grid.Col>

                          <Grid.Col span={4}>
                            <Stack gap={6}>
                              <Text
                                size="xs"
                                fw={600}
                                c="var(--color-brand)"
                                tt="uppercase"
                                style={{ letterSpacing: "0.05em" }}
                              >
                                Address
                              </Text>
                              <Text size="sm" c="var(--color-text-secondary)" lh={1.6}>
                                {partner.address || (
                                  <Text size="sm" c="dimmed" fs="italic" span>
                                    No address provided.
                                  </Text>
                                )}
                              </Text>
                            </Stack>
                          </Grid.Col>

                          <Grid.Col span={8}>
                            <Stack gap={6}>
                              <Text
                                size="xs"
                                fw={600}
                                c="var(--color-brand)"
                                tt="uppercase"
                                style={{ letterSpacing: "0.05em" }}
                              >
                                Cities Served ({partnerPercentages.length})
                              </Text>
                              <Group gap="xs">
                                {partnerPercentages.length > 0 ? (
                                  partnerPercentages.map((p) => (
                                    <Badge
                                      key={p.cityId}
                                      variant="outline"
                                      color="brand"
                                      radius="md"
                                      fw={500}
                                      tt="none"
                                      size="md"
                                      className="border-gray-200 bg-white"
                                    >
                                      {partner.status !== "waitlisted" && p.percentage != null
                                        ? `${p.city.name} · ${formatPercentDisplay(p.percentage)}`
                                        : p.city.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <Text size="sm" fs="italic" c="dimmed">
                                    None
                                  </Text>
                                )}
                              </Group>
                            </Stack>
                          </Grid.Col>
                        </Grid>
                      </Accordion.Panel>
                    </Accordion.Item>
                  );
                })}
            </Accordion>
          )}
        </ScrollArea>
      </Card>

      {partner && (
        <Modal
          opened={opened}
          title={
            <>
              Edit <Mark>{partner.name}</Mark> Partner Information
            </>
          }
          onClose={() => setPartner(null)}
          size="75%"
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
