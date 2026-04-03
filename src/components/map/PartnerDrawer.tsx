import type { Partner } from "@/generated/prisma/client";

import { Drawer, Skeleton, Stack, Group, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { GeoJsonBoundaries } from "@/lib/types";
import { PartnerMiniMap } from "./PartnerMiniMap";

const statusDisplay = (status: Partner["status"]) => {
  if (!status)
    return {
      label: "Unknown",
      bg: "#f3f4f6",
      color: "#4b5563",
      border: "#e5e7eb",
    };
  if (status === "active")
    return {
      label: "Active",
      bg: "#ecfdf3",
      color: "#027a48",
      border: "#a7f3d0",
    };
  if (status === "inactive")
    return {
      label: "Inactive",
      bg: "#fef2f2",
      color: "#b42318",
      border: "#fecdca",
    };
  return {
    label: "Waitlisted",
    bg: "#fef2f2",
    color: "#b42318",
    border: "#fecdca",
  };
};

type PartnerCoordinates = {
  lat: number;
  lng: number;
};

export interface PartnerWithStats extends Omit<Partner, "coords" | "startPartner" | "endPartner"> {
  partner_id: number;
  logoUrl: string | null;
  coordinates?: PartnerCoordinates | null;
  coords?: PartnerCoordinates | null;
  startPartner: Date | null;
  endPartner: Date | null;
  number_babies_helped: number;
  number_diapers: number;
  citiesServed: string[];
}

export interface PartnerDrawerProps {
  partnerId?: number;
  onClose: () => void;
  boundaries: GeoJsonBoundaries;
}
export default function PartnerDrawer({ partnerId, onClose, boundaries }: PartnerDrawerProps) {
  const [partner, setPartner] = useState<PartnerWithStats>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (partnerId) {
      setLoading(true);
      fetchPartnerDetails(partnerId)
        .then((data) => {
          setPartner(data);
        })
        .catch((err) => {
          console.error("Failed to fetch partner details", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setPartner(undefined);
    }
  }, [partnerId]);

  async function fetchPartnerDetails(id: number) {
    const response = await fetch(`/api/partners/${id}`);
    const result = await response.json();
    const partner = result.data as PartnerWithStats;
    partner.startPartner = partner.startPartner ? new Date(partner.startPartner) : null;
    partner.endPartner = partner.endPartner ? new Date(partner.endPartner) : null;
    partner.citiesServed = partner.citiesServed.map((c) => String(Object(c).id));
    partner.coords = partner.coordinates ?? null;
    console.log("Fetched partner details:", partner);
    return partner;
  }

  return (
    <Drawer
      opened={!!partnerId}
      onClose={onClose}
      position="right"
      padding="xl"
      size="30%"
      title={
        loading ? (
          <Group gap="md">
            <Skeleton height={56} width={56} radius="md" />
            <Stack gap="xs">
              <Skeleton height={24} width={150} radius="sm" />
              <Skeleton height={20} width={100} radius="xl" />
            </Stack>
          </Group>
        ) : partner ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.9rem",
            }}
          >
            {partner.logoUrl && (
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: "#fff",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.45rem",
                  border: "1px solid #F2F4F7",
                }}
              >
                <img
                  src={partner.logoUrl}
                  alt={`${partner.name} logo`}
                  style={{ maxWidth: "100%", maxHeight: "100%" }}
                />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Title order={3} style={{ color: "#101828", margin: 0 }}>
                {partner.name}
              </Title>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {(() => {
                  const status = statusDisplay(partner.status);
                  return (
                    <span
                      style={{
                        background: status.bg,
                        color: status.color,
                        borderRadius: "999px",
                        padding: "0.25rem 0.6rem",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        border: `1px solid ${status.border}`,
                      }}
                    >
                      {status.label}
                    </span>
                  );
                })()}
                {partner.status === "active" && (
                  <Text c="#667085" fw={600} fz="0.9rem">
                    Since {partner.startPartner?.toLocaleDateString()}
                  </Text>
                )}
              </div>
            </div>
          </div>
        ) : null
      }
      overlayProps={{ opacity: 0.2 }}
    >
      {loading ? (
        <Stack gap="lg" mt="md">
          <Skeleton height={100} radius="md" />
          <Group grow>
            <Skeleton height={80} radius="md" />
            <Skeleton height={80} radius="md" />
          </Group>
          <Group grow>
            <Skeleton height={100} radius="md" />
            <Skeleton height={100} radius="md" />
          </Group>
        </Stack>
      ) : (
        partner && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div>
              <div>Description</div>
              {partner.description ? (
                <Text c="#344054" lh={1.7} fw={500} fz="1rem" mt={6}>
                  {partner.description}
                </Text>
              ) : (
                <Text c="#9ca3af" fs="italic" fz="1rem" mt={6}>
                  No description
                </Text>
              )}
            </div>

            <PartnerMiniMap partner={partner} boundaries={boundaries} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1rem",
              }}
            >
              <div>
                <div>Address</div>
                <div>{partner.address || "N/A"}</div>
              </div>
              {partner.status == "active" && (
                <div>
                  <div>Start Year</div>
                  <div>{partner.startPartner?.getFullYear()}</div>
                </div>
              )}
            </div>

            {partner.status !== "waitlisted" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div>
                  <div>Babies Helped</div>
                  <div>{(partner.number_babies_helped || 0).toLocaleString()}</div>
                </div>

                <div>
                  <div>Diapers Provided</div>
                  <div>{(partner.number_diapers || 0).toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        )
      )}
    </Drawer>
  );
}
