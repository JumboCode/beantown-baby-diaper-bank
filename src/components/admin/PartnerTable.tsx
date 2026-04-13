"use client";

import { useState } from "react";
import { Table, Modal, Pill, Mark, Text, Button, Loader, Center, Tooltip } from "@mantine/core";
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
      <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <Table highlightOnHover withTableBorder tabularNums>
            <Table.Thead bg="#F9FAFB" c="#667085">
              <Table.Tr>
                <Table.Th fw="normal" fz="14px">
                  Partner Name
                </Table.Th>
                <Table.Th fw="normal" fz="14px">
                  Description
                </Table.Th>
                <Table.Th fw="normal" fz="14px">
                  Since
                </Table.Th>
                <Table.Th fw="normal" fz="14px">
                  Cities Served
                </Table.Th>
                <Table.Th fw="normal" fz="14px">
                  Status
                </Table.Th>
                <Table.Th fw="normal" fz="14px">
                  Address
                </Table.Th>
                <Table.Th></Table.Th>
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
                  .sort((a, b) => { // sorting: active partners first, then by start date
                    if (a.status === "active" && b.status !== "active") return -1;
                    if (a.status !== "active" && b.status === "active") return 1;
                    const dateA = a.start_partner ? new Date(a.start_partner).getTime() : Infinity;
                    const dateB = b.start_partner ? new Date(b.start_partner).getTime() : Infinity;
                    return dateA - dateB;
                  })
                  .map((partner) => (
                  <Table.Tr key={partner.id}>
                    <Table.Td style={{ maxWidth: 0, width: "20%" }}>
                      <div className="flex items-center gap-3 min-w-0">
                        {partner.logoUrl && (
                          <img
                            src={partner.logoUrl}
                            alt={partner.name}
                            className="h-10 w-10 object-contain shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <Tooltip label={partner.name} disabled={partner.name.length <= 30} withArrow>
                          <Text c="#101828" fw={600} fz={"16px"} truncate="end">
                            {partner.name}
                          </Text>
                        </Tooltip>
                      </div>
                    </Table.Td>
                    <Table.Td style={{ maxWidth: 0, width: "25%" }} className="text-sm text-gray-600">
                      {partner.description ? (
                        <Text size="sm" truncate="end">
                          {partner.description}
                        </Text>
                      ) : (
                        <span className="text-gray-400 italic">No description</span>
                      )}
                    </Table.Td>
                    <Table.Td style={{ width: 120 }} className="text-sm text-gray-600">
                      {partner.start_partner ? (
                        formatDate(partner.start_partner)
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <span key={partner.id} className="text-sm text-gray-600">
                        <span>
                          {/* percentages for waitlisted orgs are optional and
                          won't be displayed for now */}
                          {percentages
                            .filter((percentage) => Number(percentage.partnerId) === partner.id)
                            .map((p) =>
                              partner.status !== "waitlisted"
                                ? `${p.city.name} (${formatPercentDisplay(p.percentage)})`
                                : p.city.name,
                            )
                            .join(", ")}
                        </span>
                      </span>
                    </Table.Td>
                    <Table.Td align="center" style={{ width: 90 }}>
                      <Pill
                        // Fix me: colors
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
                    <Table.Td className="text-sm text-gray-600">
                      {partner.address || <span className="text-gray-400 italic">N/A</span>}
                    </Table.Td>

                    <Table.Td style={{ verticalAlign: "middle" }}>
                      <Button
                        variant="transparent"
                        // size="14px"
                        fz="14px"
                        c="#14215A"
                        onClick={() => {
                          setPartner(partner);
                          open();
                        }}
                        w="100px"
                        rightSection={
                          <Image src="/admin_view/pen.svg" alt="Edit" width={20} height={20} />
                        }
                      >
                        Edit
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </div>
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
