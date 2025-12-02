"use client";

import { useState, useEffect } from "react";
import {
  Center,
  Loader,
  Table,
  TableData,
  Modal,
  Pill,
  Mark,
  Text,
} from "@mantine/core";
import { RiPencilFill } from "react-icons/ri";
import EditPartnerForm from "../EditPartnerForm";
import { useDisclosure } from "@mantine/hooks";
import { status } from "@/generated/prisma/enums";

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
  console.log("Rounding coords", coords);
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
  const [loading, setLoading] = useState(true);
  // Retrieve data from API, store each partner as Partner type
  useEffect(() => {
    setLoading(true);
    const fetchAndStoreData = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/partners");
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
  }, []);

  const refreshTable = () => {
    setLoading(true);
    fetch("http://localhost:3000/api/partners")
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

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-[95%] mx-auto">
        {loading ? (
          <Center className="h-64">
            <Loader type="bars" />
          </Center>
        ) : (
          <PartnerTable
            partners={data}
            refreshTable={refreshTable}
          />
        )}
      </div>
    </div>
  );
}

function PartnerTable({
  partners,
  refreshTable,
}: {
  partners: Partner[];
  refreshTable: () => void;
}) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const tableData: TableData = {
    head: [
      "Name",
      "Description",
      "Partner Since",
      "Status",
      "Coordinates",
      "Address",
      "",
    ],
    body: partners.map((partner) => [
      // Image if applicable, followed by name
      <div
        key={partner.id}
        className="flex items-center gap-3">
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
        <span className="font-bold text-gray-900">{partner.name}</span>
      </div>,
      // Description
      <div
        key={partner.id}
        className="text-sm text-gray-600 max-w-md">
        {partner.description || (
          <span className="text-gray-400 italic">No description</span>
        )}
      </div>,
      // Start partner date if applicable
      <span
        key={partner.id}
        className="text-sm text-gray-600">
        {partner.start_partner ? (
          new Date(partner.start_partner).toLocaleDateString()
        ) : (
          <span className="text-gray-400 italic">N/A</span>
        )}
      </span>,

      // Status
      <Pill
        key={partner.id}
        className={`text-sm font-semibold ${
          partner.status === "active"
            ? "text-green-600"
            : partner.status === "inactive"
              ? "text-red-600"
              : "text-yellow-600"
        }`}>
        {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
      </Pill>,

      // Coordinates if applicable
      <span
        key={partner.id}
        className="text-xs text-gray-500">
        {partner.coords ? (
          joinCoords(partner.coords)
        ) : (
          <span className="text-gray-400 italic">N/A</span>
        )}
      </span>,
      // Address if applicable
      <span
        key={partner.id}
        className="text-sm text-gray-600">
        {partner.address || <span className="text-gray-400 italic">N/A</span>}
      </span>,
      <span
        key={partner.id}
        className="text-md text-teal-800 font-semibold">
        <button
          onClick={() => {
            setPartner(partner);
            open();
          }}
          className="cursor-pointer">
          <RiPencilFill size={20} />
        </button>
      </span>,
    ]),
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <Table
            data={tableData}
            highlightOnHover
            withTableBorder
            styles={{ th: { color: "#667085", backgroundColor: "#F9FAFB" } }}
          />
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
