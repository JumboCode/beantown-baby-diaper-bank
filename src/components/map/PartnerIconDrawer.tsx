import type { Partner } from "@/generated/prisma/client";
import { Drawer, Text, Title, Skeleton, Stack, Group } from "@mantine/core";
import { useEffect, useState } from "react";

export interface PartnerIconDrawerProps {
    partnerId: number | null;
    onClose: () => void;
}

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

export default function PartnerIconDrawer({ partnerId, onClose }: PartnerIconDrawerProps) {
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
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
            setSelectedPartner(null);
        }
    }, [partnerId]);

    async function fetchPartnerDetails(id: number) {
        const response = await fetch(`/api/partners/${id}`);
        const result = await response.json();
        const partner = result.data;
        partner.startPartner = new Date(result.data.startPartner);
        return partner;
    }

    interface PartnerWithStats extends Partner {
        number_babies_helped: number;
        number_diapers: number;
    }

    const partner = selectedPartner as PartnerWithStats | null;

    return (
        <Drawer
            opened={partnerId !== null}
            onClose={onClose}
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
            ) : partner && (
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
                                {partner.address || "N/A"}
                            </div>
                        </div>
                        <div style={infoCardStyle}>
                            <div style={infoLabelStyle}>Start Year</div>
                            <div style={infoValueStyle}>
                                {partner.startPartner?.getFullYear()}
                            </div>
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
                                <div style={statValueStyle}>
                                    {(partner.number_diapers || 0).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Drawer>
    );
}
