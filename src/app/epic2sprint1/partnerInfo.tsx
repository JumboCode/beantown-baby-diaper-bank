import { useState } from "react";
import { Drawer, Button, Title, Text, Badge } from "@mantine/core";

// this is the format of the data that we are retrieving using API
// one we call one index of the retrieved data as one instance of Partner
type Partner = {
  id: number;
  name: string;
  description: string | null;
  start_partner: string | null;
  status: "active" | "inactive" | "waitlisted" | null;
  address: string | null;
  coords: { lat: number; lng: number };
  logo_url: string | null;
  number_babies_helped: number;
  number_diapers: number;
};

type PartnerInfoProps = {
  id?: number | undefined;
  fromMarker?: boolean;
  name?: string | undefined;
  url?: string | null;
};

export default function PartnerInfo({
  id,
  name,
  url,
  fromMarker = false,
}: PartnerInfoProps) {
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [loadingPartner, setLoadingPartner] = useState<boolean>(false);

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

  async function fetchPartnerDetails(id: number) {
    const response = await fetch(`/api/partners/${id}`);
    const result = await response.json();
    return result.data;
  }

  async function handlePartnerClick(id: number) {
    setLoadingPartner(true);
    const fullPartner = await fetchPartnerDetails(id);
    setSelectedPartner(fullPartner);
    setLoadingPartner(false);
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          justifyContent: "center",
          flexDirection: fromMarker ? "column" : "row",
        }}
      >
        <Button
          key={id}
          variant="outline"
          // size={fromMarker ? "sm" : "xl"}
          radius="lg"
          color="dark"
          leftSection={
            url && <img src={url} style={{ height: 30 }} alt="Partner Logo" />
          }
          rightSection={
            !url ? (
              <Badge
                color="#b42318"
                variant="light"
                radius="sm"
                style={{
                  background: "#fef2f2",
                  color: "#b42318",
                  border: "1px solid #fecdca",
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                Waitlisted
              </Badge>
            ) : undefined
          }
          loading={loadingPartner}
          onClick={() => handlePartnerClick(id!)}
        >
          <span
            style={{
              display: "inline-block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </span>
        </Button>
      </div>

      {/* drawer info changes depending on what partner is selected*/}
      <Drawer
        opened={selectedPartner !== null}
        onClose={() => setSelectedPartner(null)}
        padding="xl"
        size="30%"
        title={
          selectedPartner ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.9rem",
              }}
            >
              {selectedPartner.logo_url && (
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
                    src={selectedPartner.logo_url}
                    alt={`${selectedPartner.name} logo`}
                    style={{ maxWidth: "100%", maxHeight: "100%" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Title order={3} style={{ color: "#101828", margin: 0 }}>
                  {selectedPartner.name}
                </Title>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {(() => {
                    const status = statusDisplay(selectedPartner.status);
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
                    Since {selectedPartner.start_partner || "N/A"}
                  </Text>
                </div>
              </div>
            </div>
          ) : null
        }
        overlayProps={{ opacity: 0.2 }}
      >
        {selectedPartner && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {selectedPartner.description && (
              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Description</div>
                <Text c="#344054" lh={1.7} fw={500} fz="1rem" mt={6}>
                  {selectedPartner.description}
                </Text>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1rem",
              }}
            >
              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Address</div>
                <div style={infoValueStyle}>
                  {selectedPartner.address || "N/A"}
                </div>
              </div>
              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Start Year</div>
                <div style={infoValueStyle}>
                  {selectedPartner.start_partner || "N/A"}
                </div>
              </div>
            </div>

            {selectedPartner.status !== "waitlisted" && (
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
                    {selectedPartner.number_babies_helped.toLocaleString()}
                  </div>
                </div>

                <div style={statCardStyle}>
                  <div style={infoLabelStyle}>Diapers Provided</div>
                  <div style={statValueStyle}>
                    {selectedPartner.number_diapers.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
