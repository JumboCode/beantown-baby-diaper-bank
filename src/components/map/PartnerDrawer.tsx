import type { Partner } from "@/generated/prisma/client";
import { Center, Drawer, Loader, Skeleton, Stack, Group, Text, Title } from "@mantine/core";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useBaseTileLayer } from "./useBaseTileLayer";

export interface PartnerDrawer {
  partnerId?: number;
  onClose: () => void;
}

const MapContainer = dynamic(() => import("react-leaflet").then((module) => module.MapContainer), {
  ssr: false,
  loading: () => (
    <Center h={180}>
      <Loader color="#51A3CC" size="sm" />
    </Center>
  ),
});
const TileLayer = dynamic(() => import("react-leaflet").then((module) => module.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import("react-leaflet").then((module) => module.Marker), {
  ssr: false,
});

const infoCardStyle = {
  border: "1px solid #F2F4F7",
  borderRadius: "12px",
  padding: "1rem 1.25rem",
  background: "#FFFFFF",
  boxShadow: "0 12px 30px rgba(52, 64, 84, 0.08)",
};

const infoLabelStyle = {
  fontSize: "0.85rem",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  fontWeight: 700,
};

const infoValueStyle = {
  marginTop: "0.3rem",
  color: "#111827",
  fontSize: "1rem",
  fontWeight: 600,
  lineHeight: 1.5,
};

const statCardStyle = {
  ...infoCardStyle,
  background: "#F8FAFC",
};

const statValueStyle = {
  fontSize: "1.75rem",
  fontWeight: 800,
  color: "#14215A",
  marginTop: "0.25rem",
};

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

interface PartnerWithStats extends Omit<Partner, "coords" | "startPartner" | "endPartner"> {
  partner_id: number;
  logoUrl: string | null;
  coordinates?: PartnerCoordinates | null;
  coords?: PartnerCoordinates | null;
  startPartner: Date | null;
  endPartner: Date | null;
  number_babies_helped: number;
  number_diapers: number;
}

function createPartnerIcon(leaflet: typeof import("leaflet"), url: string | null) {
  const validUrl = url && url.trim() !== "" ? url : "https://placehold.co/400x400?text=Logo";

  return leaflet.divIcon({
    className: "custom-partner-icon",
    html: `
      <div style="
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background-image: url('${validUrl}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        border: 2px solid #51A3CC;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        background-color: white;
      "></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function PartnerMiniMap({ partner }: { partner: PartnerWithStats }) {
  const coords = partner.coords ?? partner.coordinates ?? null;
  const { tileLayerProps } = useBaseTileLayer();
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    import("leaflet").then((module) => {
      setLeaflet(module);
    });
  }, []);

  if (!coords) {
    return null;
  }

  return (
    <div style={infoCardStyle}>
      <div style={infoLabelStyle}>Location</div>
      <div
        style={{
          marginTop: "0.75rem",
          height: 180,
          overflow: "hidden",
          borderRadius: 12,
          border: "1px solid #E5E7EB",
        }}
      >
        {leaflet ? (
          <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={13}
            scrollWheelZoom={true}
            dragging={true}
            doubleClickZoom={true}
            touchZoom={true}
            boxZoom={true}
            keyboard={true}
            zoomControl={false}
            attributionControl={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer {...tileLayerProps} />
            <Marker
              position={[coords.lat, coords.lng]}
              icon={createPartnerIcon(leaflet, partner.logoUrl)}
            />
          </MapContainer>
        ) : (
          <Center h="100%">
            <Loader color="#51A3CC" size="sm" />
          </Center>
        )}
      </div>
    </div>
  );
}

export default function PartnerDrawer({ partnerId, onClose }: PartnerDrawer) {
  const [selectedPartner, setSelectedPartner] = useState<PartnerWithStats>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (partnerId) {
      setLoading(true);
      fetchPartnerDetails(partnerId)
        .then((data) => {
          setSelectedPartner(data);
        })
        .catch((err) => {
          console.error("Failed to fetch partner details", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setSelectedPartner(undefined);
    }
  }, [partnerId]);

  async function fetchPartnerDetails(id: number) {
    const response = await fetch(`/api/partners/${id}`);
    const result = await response.json();
    const partner = result.data as PartnerWithStats;
    partner.startPartner = partner.startPartner ? new Date(partner.startPartner) : null;
    partner.endPartner = partner.endPartner ? new Date(partner.endPartner) : null;
    partner.coords = partner.coordinates ?? null;
    return partner;
  }

  const partner = selectedPartner;

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
                <Text c="#667085" fw={600} fz="0.9rem">
                  Since {partner.startPartner?.toLocaleDateString()}
                </Text>
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
            {partner.description && (
              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Description</div>
                <Text c="#344054" lh={1.7} fw={500} fz="1rem" mt={6}>
                  {partner.description}
                </Text>
              </div>
            )}

            <PartnerMiniMap partner={partner} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1rem",
              }}
            >
              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Address</div>
                <div style={infoValueStyle}>{partner.address || "N/A"}</div>
              </div>
              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Start Year</div>
                <div style={infoValueStyle}>{partner.startPartner?.getFullYear()}</div>
              </div>
            </div>

            {partner.status !== "waitlisted" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div style={statCardStyle}>
                  <div style={infoLabelStyle}>Babies Helped</div>
                  <div style={statValueStyle}>
                    {(partner.number_babies_helped || 0).toLocaleString()}
                  </div>
                </div>

                <div style={statCardStyle}>
                  <div style={infoLabelStyle}>Diapers Provided</div>
                  <div style={statValueStyle}>{(partner.number_diapers || 0).toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        )
      )}
    </Drawer>
  );
}
