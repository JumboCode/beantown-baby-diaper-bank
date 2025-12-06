import { useState, useEffect, use } from "react";
import { Drawer, Button } from "@mantine/core";

// this is the format of the data that we are retrieving using API
// one we call one index of the retrieved data as one instance of Partner
type Partner = {
  id: number;
  name: string;
  description: string | null;
  start_partner: string | null;
  status: boolean;
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
  //changed this b/c disclosure was only showing info for one partner
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [loadingPartner, setLoadingPartner] = useState<boolean>(false);

  async function fetchPartnerDetails(id: number) {
    const response = await fetch(`/api/partners/${id}`);
    const result = await response.json();
    return result.data;
  }

  async function handlePartnerClick(id: number) {
    setLoadingPartner(true);
    const fullPartner = await fetchPartnerDetails(id);
    console.log("Fetched partner details:", fullPartner);
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
          leftSection={url && <img src={url} style={{ height: 30 }} />}
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
        // title={selectedPartner?.name || "Information"}

        overlayProps={{ opacity: 0.2 }}
      >
        {selectedPartner && (
          <div style={{ lineHeight: 1.5 }}>
            <p style={{ marginBottom: "1.75rem" }}>
              <span style={{ color: "#14215A", fontWeight: 600 }}>
                Organization Name:
              </span>{" "}
              <span style={{ color: "#101828" }}>{selectedPartner.name}</span>
            </p>

            <p style={{ marginBottom: "1.75rem" }}>
              <span style={{ color: "#14215A", fontWeight: 600 }}>
                Description:
              </span>{" "}
              <span style={{ color: "#101828" }}>
                {selectedPartner.description || "N/A"}
              </span>
            </p>

            <p style={{ marginBottom: "1.75rem" }}>
              <span style={{ color: "#14215A", fontWeight: 600 }}>
                Start Year:
              </span>{" "}
              <span style={{ color: "#101828" }}>
                {selectedPartner.start_partner || "N/A"}
              </span>
            </p>

            <p style={{ marginBottom: "1.75rem" }}>
              <span style={{ color: "#14215A", fontWeight: 600 }}>Active:</span>{" "}
              <span style={{ color: "#101828" }}>
                {selectedPartner.status ? "No" : "Yes"}
              </span>
            </p>

            <p style={{ marginBottom: "1.75rem" }}>
              <span style={{ color: "#14215A", fontWeight: 600 }}>
                Address:
              </span>{" "}
              <span style={{ color: "#101828" }}>
                {selectedPartner.address || "N/A"}
              </span>
            </p>

            <p style={{ marginBottom: "1.75rem" }}>
              <span style={{ color: "#14215A", fontWeight: 600 }}>
                Babies Helped:
              </span>{" "}
              <span style={{ color: "#101828" }}>
                {selectedPartner.number_babies_helped}
              </span>
            </p>

            <p style={{ marginBottom: "1.75rem" }}>
              <span style={{ color: "#14215A", fontWeight: 600 }}>
                Diapers Provided:
              </span>{" "}
              <span style={{ color: "#101828" }}>
                {selectedPartner.number_diapers}
              </span>
            </p>

            {selectedPartner.logo_url && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  margin: "1rem 0",
                }}
              >
                <img
                  src={selectedPartner.logo_url}
                  alt={`${selectedPartner.name} logo`}
                  style={{
                    maxWidth: "200px",
                    borderRadius: "4px",
                  }}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
