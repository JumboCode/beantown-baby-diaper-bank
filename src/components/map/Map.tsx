"use client";

import dynamic from "next/dynamic";
import { useCountUp } from "./useCountUp";
import { useLeafletMap, DEFAULT_CENTER, DEFAULT_ZOOM } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
import { useEffect, useMemo, useRef, useState } from "react";
import { CityPopup } from "./CityPopup";
import PartnerDrawer from "./PartnerDrawer";
import { cityScore, getScoreColor, LEVEL_COLORS } from "@/lib/hotmap";
import { IconMapPin, IconHome } from "@tabler/icons-react";
import { LatLngExpression } from "leaflet";
import { Text, Stack, Group, Box, Badge, ThemeIcon } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { TileLayer, MapContainer, Tooltip, useMap } from "react-leaflet";
import MakeAnImpact from "./MakeAnImpact";
import BabiesHelped from "./BabiesHelped";
import { Polygon as ReactLeafletPolygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Image from "next/image";
import { CityWithStats, GeoJsonBoundaries } from "@/lib/types";

export const Marker = dynamic(() => import("react-leaflet").then((module) => module.Marker), {
  ssr: false,
});

export const ZoomControl = dynamic(
  () => import("react-leaflet").then((module) => module.ZoomControl),
  { ssr: false },
);

function ResetViewControl() {
  const map = useMap();
  return (
    <div className="leaflet-top leaflet-left" style={{ marginTop: 74 }}>
      <div className="leaflet-control leaflet-bar">
        <a
          role="button"
          title="Reset view"
          aria-label="Reset view"
          onClick={() => map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <IconHome size={16} />
        </a>
      </div>
    </div>
  );
}

export interface MapProps {
  boundaries: GeoJsonBoundaries;
  cities: CityWithStats[];
  year: string;
  totalDiapersForYear?: number;
  selectedYear?: string;
  babiesHelped?: number;
}

export default function Map({
  boundaries,
  cities,
  year,
  totalDiapersForYear,
  selectedYear,
  babiesHelped,
}: MapProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { mapConfig } = useLeafletMap(isMobile ? 8 : DEFAULT_ZOOM);
  const { style: mapStyle, ...mapOptions } = mapConfig;
  const { tileLayerProps } = useBaseTileLayer();
  const [hoveredCityId, setHoveredCityId] = useState<string>();
  const [activeCityId, setActiveCityId] = useState<string>();
  const [activeCityName, setActiveCityName] = useState<string>();
  const [selectedPartnerId, setSelectedPartnerId] = useState<number>();

  const animatedRunningTotal = useCountUp(totalDiapersForYear, 1400);

  const activeCityWithStats = cities.find((c) => c.name === activeCityName);

  interface BoundaryPolygon {
    id: string;
    positions: LatLngExpression[][];
    name: string;
    fillColor: string;
    totalDiapers: number;
  }

  const boundaryPolygons: BoundaryPolygon[] = useMemo(() => {
    if (!boundaries || cities.length === 0) return [];

    const cityTotals: Record<string, number> = {};
    const cityStats: Record<
      string,
      { median: number; p25: number; p75: number } | null | undefined
    > = {};

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1–12
    const isCurrentYear = selectedYear === String(currentYear);

    cities.forEach((city) => {
      const total = city.distributions.reduce((sum, d) => sum + Number(d.numberDiapers), 0);
      // Annualize the current year's total so it's comparable to historical
      // full-year values used in the quartile stats.
      const scoringTotal = isCurrentYear && currentMonth > 0 ? (total / currentMonth) * 12 : total;
      if (city.name) {
        cityTotals[city.name] = scoringTotal;
        cityStats[city.name] = city.stats.historical;
      }
    });

    return boundaries.features.map((feature) => {
      const name = feature.properties?.name;
      const total = name ? cityTotals[name] || 0 : 0;
      const stats = name ? cityStats[name] : null;

      let fillColor = "#E4E7EC"; // Gray for no data
      if (total > 0 && stats) {
        const score = cityScore(total, stats.median, stats.p25, stats.p75);
        fillColor = getScoreColor(score);
      } else if (total > 0 && !stats) {
        // Fallback for missing stats
        fillColor = LEVEL_COLORS[0];
      }

      return {
        id: name || Math.random(),
        positions: feature.geometry.coordinates as unknown as LatLngExpression[][],
        name: name,
        fillColor,
        totalDiapers: total,
      };
    });
  }, [boundaries, cities]);

  const visibleBoundaries = useMemo(
    () => boundaryPolygons.filter((boundary) => boundary.totalDiapers > 0),
    [boundaryPolygons],
  );

  const previousVisibleIdsRef = useRef<Set<string>>(new Set());

  const enteringBoundaryIds = useMemo(() => {
    const previous = previousVisibleIdsRef.current;
    const entering = new Set<string>();

    visibleBoundaries.forEach((boundary, index) => {
      const boundaryId = String(boundary.id || index);
      if (!previous.has(boundaryId)) entering.add(boundaryId);
    });

    return entering;
  }, [visibleBoundaries]);

  useEffect(() => {
    previousVisibleIdsRef.current = new Set(
      visibleBoundaries.map((boundary, index) => String(boundary.id || index)),
    );
  }, [visibleBoundaries]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", zIndex: 0 }}>
      {/* Map */}
      <MapContainer {...mapOptions} zoomControl={false} style={mapStyle}>
        <ZoomControl position="topleft" />
        <ResetViewControl />
        <TileLayer {...tileLayerProps} />
        {visibleBoundaries.map((boundary, index) => {
          const boundaryId = String(boundary.id || index);
          const isEntering = enteringBoundaryIds.has(boundaryId);

          return (
            <ReactLeafletPolygon
              key={boundaryId}
              className={isEntering ? "city-boundary city-boundary-enter" : "city-boundary"}
              pathOptions={{
                weight:
                  activeCityId === boundary.id ? 2 : hoveredCityId === boundary.id ? 2.5 : 0.5,
                color:
                  activeCityId === boundary.id
                    ? "#1B3668"
                    : hoveredCityId === boundary.id
                      ? "#CC2027"
                      : "#5A7687",
                fillColor: boundary.fillColor,
                fillOpacity:
                  activeCityId === boundary.id ? 0.75 : hoveredCityId === boundary.id ? 0.65 : 0.35,
              }}
              positions={boundary.positions}
              eventHandlers={{
                mouseover: () => setHoveredCityId(boundary.id),
                mouseout: () =>
                  setHoveredCityId((current) => (current === boundary.id ? undefined : current)),
                click: () => {
                  if (!isMobile) {
                    setActiveCityName(boundary.name);
                    setActiveCityId(boundary.id);
                  }
                },
                preclick: () => {
                  if (isMobile) {
                    setActiveCityName(boundary.name);
                    setActiveCityId(boundary.id);
                  }
                },
              }}
            >
              {boundary.name &&
                (() => {
                  const city = cities.find((c) => c.name === boundary.name);
                  if (!city) {
                    return (
                      <Tooltip sticky direction="top" offset={[0, -4]}>
                        <Text fw={700} fz="sm" c="#0F4F78">
                          {boundary.name}
                        </Text>
                      </Tooltip>
                    );
                  }

                  const totalDiapers =
                    city.distributions.reduce((sum, d) => sum + Number(d.numberDiapers), 0) ?? 0;

                  const selectedYear = Number(year);
                  const activePartners = city.partners.filter((p) => {
                    const isWaitlisted =
                      p.status === "waitlisted" ||
                      (p as any).waitlisted === true ||
                      (p as any).waitlisted === "true";
                    const isInactive = p.status === "inactive";
                    let startedOnOrBeforeYear = true;
                    if ((p as any).startPartner) {
                      startedOnOrBeforeYear =
                        new Date((p as any).startPartner).getUTCFullYear() <= selectedYear;
                    }
                    return !isWaitlisted && !isInactive && startedOnOrBeforeYear;
                  });

                  return (
                    <Tooltip
                      sticky
                      direction="top"
                      offset={[0, -10]}
                      opacity={1}
                      className="custom-map-tooltip"
                    >
                      <Box
                        style={{
                          background: "rgba(255, 255, 255, 0.96)",
                          border: "1px solid #E4E7EC",
                          borderRadius: 12,
                          boxShadow: "0 8px 24px rgba(16, 24, 40, 0.12)",
                          padding: "10px 14px",
                          backdropFilter: "blur(8px)",
                          minWidth: 160,
                          textAlign: "left",
                        }}
                      >
                        <Group gap={6} mb={4} wrap="nowrap">
                          <ThemeIcon
                            size={20}
                            radius="xl"
                            variant="light"
                            color="cyan"
                            styles={{ root: { backgroundColor: "#E0F2FE", color: "#0F6B99" } }}
                          >
                            <IconMapPin size={12} />
                          </ThemeIcon>
                          <Text fw={800} fz="15px" c="#101828" lh={1}>
                            {boundary.name}
                          </Text>
                        </Group>

                        {totalDiapers === 0 ? (
                          <Text fz="12px" c="#667085" fw={500} mt={6}>
                            0 diapers distributed this year
                          </Text>
                        ) : (
                          <Stack gap={4} mt={6}>
                            <Group justify="space-between" wrap="nowrap">
                              <Text fz="11px" fw={700} c="#475467" tt="uppercase">
                                in {year}
                              </Text>
                              <Text fz="13px" fw={800} c="#16A34A">
                                +{totalDiapers.toLocaleString()}
                              </Text>
                            </Group>
                            <Group justify="space-between" wrap="nowrap">
                              <Text fz="11px" fw={700} c="#475467" tt="uppercase">
                                Total
                              </Text>
                              <Text fz="13px" fw={800} c="#0F6B99">
                                {city.stats.runningTotal?.toLocaleString() ?? 0}
                              </Text>
                            </Group>
                            <Group justify="space-between" wrap="nowrap" mt={2}>
                              <Text fz="11px" fw={700} c="#475467" tt="uppercase">
                                Partner Orgs
                              </Text>
                              <Badge variant="light" color="blue" size="sm" radius="xl" fw={700}>
                                {activePartners.length}
                              </Badge>
                            </Group>
                          </Stack>
                        )}
                      </Box>
                    </Tooltip>
                  );
                })()}
            </ReactLeafletPolygon>
          );
        })}
      </MapContainer>

      {/* Total Diapers Distributed */}
      <Box
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 1000,
          pointerEvents: "none",
          minWidth: isMobile ? 0 : 240,
          background: "#1B3668",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(27, 54, 104, 0.4)",
          padding: isMobile ? "8px 12px" : "14px 18px",
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap={isMobile ? 8 : 12}>
          <Stack gap={isMobile ? 1 : 4}>
            <Text
              fz={isMobile ? "9px" : "10px"}
              fw={700}
              c="rgba(255,255,255,0.55)"
              tt="uppercase"
              lts="0.1em"
            >
              {isMobile
                ? (selectedYear ?? "Total")
                : `Total Diapers${selectedYear ? ` Through ${selectedYear}` : ""}`}
            </Text>
            <Text fz={isMobile ? "22px" : "40px"} fw={900} c="white" lh={1}>
              {totalDiapersForYear != null ? animatedRunningTotal.toLocaleString() : "--"}
            </Text>
            {isMobile && (
              <Text fz="8px" fw={600} c="rgba(255,255,255,0.5)" tt="uppercase" lts="0.05em">
                diapers
              </Text>
            )}
          </Stack>
          {!isMobile && (
            <Image
              src="/diaper.svg"
              alt="Diaper icon"
              width={52}
              height={42}
              style={{
                filter: "brightness(0) invert(1)",
                opacity: 0.7,
                flexShrink: 0,
                marginTop: 2,
              }}
            />
          )}
        </Group>
      </Box>

      {/* Babies Helped */}
      {!(isMobile && activeCityWithStats) && (
        <Box
          style={{
            position: "absolute",
            top: isMobile ? 76 : 111,
            right: 16,
            zIndex: 1000,
            pointerEvents: "none",
          }}
        >
          <BabiesHelped babiesHelped={babiesHelped} year={selectedYear} />
        </Box>
      )}

      {/* City Popup — side panel on desktop, bottom sheet on mobile */}
      {activeCityWithStats && (
        <Box
          style={
            isMobile
              ? {
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  maxHeight: "60vh",
                  overflowY: "auto",
                  background: "rgba(255, 255, 255, 0.99)",
                  borderRadius: "12px 12px 0 0",
                  boxShadow: "0 -4px 24px rgba(16, 24, 40, 0.18)",
                }
              : {
                  position: "absolute",
                  top: 186,
                  right: 16,
                  zIndex: 1000,
                  width: 350,
                  maxHeight: "calc(100% - 265px)",
                  overflowY: "auto",
                  background: "rgba(255, 255, 255, 0.97)",
                  border: "1px solid #E4E7EC",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(16, 24, 40, 0.12)",
                  backdropFilter: "blur(8px)",
                }
          }
        >
          <CityPopup
            city={activeCityWithStats}
            year={year}
            onPartnerSelect={setSelectedPartnerId}
            onClose={() => {
              setActiveCityName(undefined);
              setActiveCityId(undefined);
            }}
          />
        </Box>
      )}

      {/* Legend — hidden on mobile when city popup is open to avoid overlap */}
      {!(isMobile && activeCityWithStats) && (
        <Box
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            zIndex: 1000,
            pointerEvents: "none",
            background: "rgba(255, 255, 255, 0.96)",
            border: "1px solid #E4E7EC",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(16, 24, 40, 0.12)",
            padding: isMobile ? "8px 10px" : "12px 14px",
            backdropFilter: "blur(8px)",
            minWidth: isMobile ? 160 : 220,
            maxWidth: isMobile ? 200 : 280,
          }}
        >
          {!isMobile && (
            <Text fz="11px" fw={800} c="#475467" tt="uppercase" mb={8} lts="0.05em">
              Relative Distribution Volume
            </Text>
          )}
          <Box
            style={{
              height: isMobile ? 6 : 8,
              borderRadius: 8,
              width: "100%",
              background: `linear-gradient(to right, ${LEVEL_COLORS.join(", ")})`,
              marginBottom: isMobile ? 4 : 6,
            }}
          />
          <Group justify="space-between">
            <Text fz="10px" fw={700} c="#667085" tt="uppercase">
              Low
            </Text>
            <Text fz="10px" fw={700} c="#667085" tt="uppercase">
              High
            </Text>
          </Group>
        </Box>
      )}

      {/* Make an Impact */}
      {!(isMobile && activeCityWithStats) && (
        <Box
          style={
            isMobile
              ? {
                  position: "absolute",
                  bottom: 16,
                  right: 16,
                  zIndex: 1001,
                }
              : {
                  position: "absolute",
                  top: 16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 1001,
                }
          }
        >
          <MakeAnImpact />
        </Box>
      )}

      <PartnerDrawer
        partnerId={selectedPartnerId}
        onClose={() => setSelectedPartnerId(undefined)}
        boundaries={boundaries}
      />
    </div>
  );
}
