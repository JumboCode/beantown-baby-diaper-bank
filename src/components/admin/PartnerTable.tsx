"use client";

import { useState, Fragment } from "react";
import {
  Table,
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
  Collapse,
  Grid,
} from "@mantine/core";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  const [expandedRowIds, setExpandedRowIds] = useState<number[]>([]);

  const toggleRow = (id: number) => {
    setExpandedRowIds((current) =>
      current.includes(id) ? current.filter((rowId) => rowId !== id) : [...current, id],
    );
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg flex flex-col h-full">
        <ScrollArea className="flex-1" type="auto" offsetScrollbars>
          <Table highlightOnHover withTableBorder tabularNums>
            <Table.Thead bg="#F9FAFB" c="#667085">
              <Table.Tr>
                <Table.Th fw="normal" fz="14px" w="35%">
                  Partner Name
                </Table.Th>
                <Table.Th fw="normal" fz="14px" w="20%">
                  Since
                </Table.Th>
                <Table.Th fw="normal" fz="14px" w="20%">
                  Cities Served
                </Table.Th>
                <Table.Th fw="normal" fz="14px" w="15%" ta="center">
                  Status
                </Table.Th>
                <Table.Th w="10%"></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Center py="lg">
                      <Loader type="bars" />
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                [...partners]
                  .sort((a, b) => {
                    // sorting: active partners first, then by start date
                    if (a.status === "active" && b.status !== "active") return -1;
                    if (a.status !== "active" && b.status === "active") return 1;
                    const dateA = a.start_partner ? new Date(a.start_partner).getTime() : Infinity;
                    const dateB = b.start_partner ? new Date(b.start_partner).getTime() : Infinity;
                    return dateA - dateB;
                  })
                  .map((partner) => {
                    const isExpanded = expandedRowIds.includes(partner.id);
                    const partnerPercentages = percentages
                      .filter((percentage) => Number(percentage.partnerId) === partner.id)
                      .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0));

                    return (
                      <Fragment key={partner.id}>
                        <Table.Tr bg={isExpanded ? "#F8FAFC" : undefined}>
                          <Table.Td>
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
                              <Text c="#101828" fw={600} fz={"16px"}>
                                {partner.name}
                              </Text>
                            </div>
                          </Table.Td>
                          <Table.Td>
                            {partner.start_partner ? (
                              <Text size="sm" c="dimmed">{formatDate(partner.start_partner)}</Text>
                            ) : (
                              <Text size="sm" c="dimmed" fs="italic">N/A</Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" fw={500} c="dimmed">
                              {partnerPercentages.length} {partnerPercentages.length === 1 ? "City" : "Cities"}
                            </Text>
                          </Table.Td>
                          <Table.Td align="center">
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
                          </Table.Td>

                          <Table.Td style={{ verticalAlign: "middle" }}>
                            <Group gap="xs" wrap="nowrap">
                              <ActionIcon
                                variant="subtle"
                                size="md"
                                color="gray"
                                onClick={() => toggleRow(partner.id)}
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </ActionIcon>
                              <ActionIcon
                                variant="subtle"
                                size="md"
                                color="#14215A"
                                onClick={() => {
                                  setPartner(partner);
                                  open();
                                }}
                              >
                                <Image
                                  src="/admin_view/pen.svg"
                                  alt="Edit"
                                  width={16}
                                  height={16}
                                />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>

                        {isExpanded && (
                          <Table.Tr>
                            <Table.Td colSpan={7} p={0} style={{ borderBottom: 0 }}>
                              <Collapse in={isExpanded}>
                                <div
                                  className="bg-[#F8FAFC] pt-6 pb-8 px-6"
                                  style={{
                                    borderLeft: "4px solid #14215A",
                                    borderBottom: "1px solid #E5E7EB",
                                    boxShadow: "inset 0 4px 6px -4px rgb(0 0 0 / 0.05)",
                                  }}
                                >
                                  <Grid gutter="xl">
                                    <Grid.Col span={4}>
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
                                    <Grid.Col span={5}>
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
                                              {partner.status !== "waitlisted" &&
                                              p.percentage != null
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
                                </div>
                              </Collapse>
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </Fragment>
                    );
                  })
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </div>

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
