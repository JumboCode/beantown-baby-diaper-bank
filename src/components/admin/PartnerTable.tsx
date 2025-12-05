"use client";

import { useState, useEffect } from "react";
import {
  Center,
  Loader,
  Table,
  Modal,
  Pill,
  Mark,
  Text,
  ActionIcon,
} from "@mantine/core";
import { PartnerRegion } from "@/generated/prisma/client";
import UpdatePercentPartnerForm from "../UpdatePercentPartnerForm";
import EditPartnerForm from "../EditPartnerForm";
import { useDisclosure } from "@mantine/hooks";
import { status } from "@/generated/prisma/enums";
import Image from "next/image";

export type Partner = {
  id: number;
  created_at: string;
  name: string;
  description: string | null;
  start_partner: string | null;
  status: status;
  address: string | null;
  coords?: { lat: number; lng: number };
  logo_url: string | null;
};

function roundCoords(coords: { lat: number; lng: number }) {
  if (coords.lat.toString().length > 4 && coords.lng.toString().length > 4) {
    return {
      lat: coords.lat.toFixed(4),
      lng: coords.lng.toFixed(4),
    };
  }
  return {
    lat: coords.lat.toString(),
    lng: coords.lng.toString(),
  };
}

function joinCoords(coords: { lat: number; lng: number }) {
  return `${roundCoords(coords).lat}, ${roundCoords(coords).lng}`;
}

export default function PartnerInfo() {
  const [data, setData] = useState<Partner[]>([]);
  const [percentages, setPercentages] = useState<PartnerRegion[]>([]);
  const [loading, setLoading] = useState(true);
  // Retrieve data from API, store each partner as Partner type
  useEffect(() => {
    setLoading(true);
    const fetchAndStoreData = async () => {
      try {
        const response = await fetch("/api/partners");
        const result = await response.json();
        console.log("Fetched partner data:", result.data);
        setData(result.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndStoreData();

    const getPercentagesWithCityId = async () => {
      try {
        const response = await fetch("/api/partners/percentages");
        const result = await response.json();
        setPercentages(result.data);
      } catch (err) {
        console.log("Error fetching percentages data", err);
      }
    };

    getPercentagesWithCityId();
  }, []);

  const refreshTable = () => {
    setLoading(true);
    fetch("/api/partners")
      .then((response) => response.json())
      .then((result) => {
        console.log("Refetched partner data:", result.data);
        setData(result.data);
      })
      .catch((err) => {
        console.error("Error refetching data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return loading ? (
    <Center className="h-64">
      <Loader type="bars" />
    </Center>
  ) : (
    <>
      <PartnerTable
        partners={data}
        refreshTable={refreshTable}
        percentages={percentages}
      />
    </>
  );
}

function PartnerTable({
  partners,
  refreshTable,
  percentages,
}: {
  partners: Partner[];
  refreshTable: () => void;
  percentages: PartnerRegion[];
}) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <Table
            highlightOnHover
            withTableBorder
            styles={{ th: { color: "#667085" } }}
            tabularNums>
            <Table.Thead style={{ backgroundColor: "#F9FAFB" }}>
              <Table.Tr>
                <Table.Th></Table.Th>
                <Table.Th>Partner Name</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Partner Since</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Coordinates</Table.Th>
                <Table.Th>Address</Table.Th>
                <Table.Th>Cities Served</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {partners.map((partner) => (
                <Table.Tr key={partner.id}>
                  <Table.Td style={{ verticalAlign: "middle" }}>
                    <ActionIcon
                      variant="light"
                      onClick={() => {
                        setPartner(partner);
                        open();
                      }}
                      size="lg">
                      <Image
                        src="/admin_view/pen.svg"
                        alt="Edit"
                        width={20}
                        height={20}
                      />
                    </ActionIcon>
                  </Table.Td>
                  <Table.Td>
                    <div className="flex items-center gap-3">
                      {partner.logo_url && (
                        <img
                          src={partner.logo_url}
                          alt={partner.name}
                          className="h-10 w-10 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <span className="font-bold text-gray-900">
                        {partner.name}
                      </span>
                    </div>
                  </Table.Td>
                  <Table.Td className="text-sm text-gray-600 max-w-md">
                    {partner.description || (
                      <span className="text-gray-400 italic">
                        No description
                      </span>
                    )}
                  </Table.Td>
                  <Table.Td className="text-sm text-gray-600">
                    {partner.start_partner ? (
                      new Date(partner.start_partner).toLocaleDateString()
                    ) : (
                      <span className="text-gray-400 italic">N/A</span>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Pill
                      className={`text-sm font-semibold ${
                        partner.status === "active"
                          ? "text-green-600"
                          : partner.status === "inactive"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}>
                      {partner.status.charAt(0).toUpperCase() +
                        partner.status.slice(1)}
                    </Pill>
                  </Table.Td>
                  <Table.Td className="text-xs text-gray-500">
                    {partner.coords ? (
                      joinCoords(partner.coords)
                    ) : (
                      <span className="text-gray-400 italic">N/A</span>
                    )}
                  </Table.Td>
                  <Table.Td className="text-sm text-gray-600">
                    {partner.address || (
                      <span className="text-gray-400 italic">N/A</span>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <span
                      key={partner.id}
                      className="text-sm text-gray-600">
                      <span>
                        {percentages
                          .filter(
                            (percentage) =>
                              Number(percentage.partnerId) == partner.id
                          )
                          .map((percentage, index, arr) => {
                            if (percentage.percentage) {
                              return (
                                percentage.cityId +
                                " (" +
                                percentage.percentage * 100 +
                                "%)" +
                                (index != arr.length - 1 ? ", " : "")
                              );
                            }
                          })}
                      </span>
                    </span>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </div>

      {partner && (
        <Modal
          opened={opened}
          title={
            <Text
              fw={700}
              size="32px">
              Edit{" "}
              <Mark
                bg="none"
                c="blue">
                {partner.name}
              </Mark>{" "}
              Partner Information
            </Text>
          }
          onClose={() => setPartner(null)}
          size="75%"
          centered>
          <EditPartnerForm
            partner={partner}
            onClose={() => {
              close();
              setPartner(null);
              refreshTable();
            }}
          />
        </Modal>
      )}
    </>
  );
}
