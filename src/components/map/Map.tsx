"use client";

import dynamic from "next/dynamic";
import { useCountUp } from "./useCountUp";
import { useLeafletMap, DEFAULT_CENTER, DEFAULT_ZOOM } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
import React, { useEffect, useMemo, useRef, useState, memo } from "react";
import { CityPopup } from "./CityPopup";
import PartnerDrawer from "./PartnerDrawer";
import { cityScore, getScoreColor, LEVEL_COLORS } from "@/lib/hotmap";
import { IconMapPin, IconHome } from "@tabler/icons-react";
import { LatLngExpression } from "leaflet";
import { Text, Stack, Group, Box, Badge, ThemeIcon } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { TileLayer, MapContainer, Tooltip, useMap, Pane } from "react-leaflet";
import BabiesHelped from "./BabiesHelped";
import { Polygon as ReactLeafletPolygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CityWithStats, GeoJsonBoundaries } from "@/lib/types";
import L from "leaflet";

function getGeometryStats(positions: any[]): { area: number; center: [number, number] } {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  function recurse(arr: any[]) {
    for (const item of arr) {
      if (Array.isArray(item)) {
        if (item.length >= 2 && typeof item[0] === "number") {
          minX = Math.min(minX, item[0]);
          maxX = Math.max(maxX, item[0]);
          minY = Math.min(minY, item[1]);
          maxY = Math.max(maxY, item[1]);
        } else {
          recurse(item);
        }
      }
    }
  }

  if (!positions) return { area: 0, center: [0, 0] };
  recurse(positions);

  if (minX === Infinity) return { area: 0, center: [0, 0] };
  return {
    area: (maxX - minX) * (maxY - minY),
    center: [(minX + maxX) / 2, (minY + maxY) / 2],
  };
}

export const CircleMarker = dynamic(
  () => import("react-leaflet").then((module) => module.CircleMarker),
  {
    ssr: false,
  },
);

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
  yearlyTotalDiapers?: number;
  selectedYear?: string;
  babiesHelped?: number;
}

const MemoizedCityPolygon = memo(
  ({
    boundary,
    index,
    boundaryId,
    isEntering,
    isActive,
    isHovered,
    year,
    cities,
    isMobile,
    setHoveredCityId,
    setActiveCityName,
    setActiveCityId,
  }: any) => {
    return (
      <Pane name={`pane-${boundaryId}`} style={{ zIndex: 400 + index }}>
        <ReactLeafletPolygon
          className={isEntering ? "city-boundary city-boundary-enter" : "city-boundary"}
          pathOptions={{
            weight: isActive ? 3 : isHovered ? 2.5 : 0.5,
            color: isActive || isHovered ? "#CC2027" : "#5A7687",
            fillColor: boundary.fillColor,
            fillOpacity: 0.85,
          }}
          positions={boundary.positions}
          eventHandlers={{
            mouseover: () => setHoveredCityId(boundary.id),
            mouseout: () =>
              setHoveredCityId((current: string | undefined) =>
                current === boundary.id ? undefined : current,
              ),
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
              const city = cities.find((c: any) => c.name === boundary.name);
              if (!city) {
                return (
                  <Tooltip pane="tooltipPane" sticky direction="top" offset={[0, -4]}>
                    <Text fw={700} fz="sm" c="#0F4F78">
                      {boundary.name}
                    </Text>
                  </Tooltip>
                );
              }

              const totalDiapers =
                city.distributions.reduce(
                  (sum: number, d: any) => sum + Number(d.numberDiapers),
                  0,
                ) ?? 0;

              const selectedYear = Number(year);
              const activePartners = city.partners.filter((p: any) => {
                const isWaitlisted =
                  p.status === "waitlisted" || p.waitlisted === true || p.waitlisted === "true";
                const isInactive = p.status === "inactive";
                let startedOnOrBeforeYear = true;
                if (p.startPartner) {
                  startedOnOrBeforeYear = new Date(p.startPartner).getUTCFullYear() <= selectedYear;
                }
                return !isWaitlisted && !isInactive && startedOnOrBeforeYear;
              });

              return (
                <Tooltip
                  pane="tooltipPane"
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
                      boxShadow: "0 12px 32px rgba(16, 24, 40, 0.16)",
                      padding: "14px 16px",
                      backdropFilter: "blur(8px)",
                      minWidth: 220,
                      maxWidth: 260,
                      textAlign: "left",
                    }}
                  >
                    <Group gap={6} mb={10} wrap="nowrap">
                      <ThemeIcon
                        size={22}
                        radius="xl"
                        variant="light"
                        color="cyan"
                        styles={{ root: { backgroundColor: "#E0F2FE", color: "#0F6B99" } }}
                      >
                        <IconMapPin size={14} />
                      </ThemeIcon>
                      <Text fw={800} fz="16px" c="#101828" lh={1}>
                        {boundary.name}
                      </Text>
                    </Group>

                    <Stack gap={12}>
                      {totalDiapers === 0 ? (
                        <Text fz="12px" c="#667085" fw={500} mt={2}>
                          0 diapers distributed this year
                        </Text>
                      ) : (
                        <>
                          <Group grow gap={8}>
                            <Box
                              style={{
                                background: "#F8FAFC",
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: "1px solid #F1F5F9",
                              }}
                            >
                              <Text fz="10px" fw={700} c="#64748B" tt="uppercase">
                                in {year}
                              </Text>
                              <Text fz="15px" fw={800} c="#16A34A" lh={1.2} mt={2}>
                                +{totalDiapers.toLocaleString()}
                              </Text>
                            </Box>
                            <Box
                              style={{
                                background: "#F8FAFC",
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: "1px solid #F1F5F9",
                              }}
                            >
                              <Text fz="10px" fw={700} c="#64748B" tt="uppercase">
                                Total
                              </Text>
                              <Text fz="15px" fw={800} c="#0F6B99" lh={1.2} mt={2}>
                                {city.stats.runningTotal?.toLocaleString() ?? 0}
                              </Text>
                            </Box>
                          </Group>

                          <Box>
                            <Group justify="space-between" wrap="nowrap">
                              <Text fz="11px" fw={800} c="#475467" tt="uppercase">
                                Partner Orgs
                              </Text>
                              <Badge variant="light" color="blue" size="sm" radius="sm" fw={800}>
                                {activePartners.length}
                              </Badge>
                            </Group>
                          </Box>
                        </>
                      )}

                      {!isMobile && (
                        <Group
                          gap={6}
                          wrap="nowrap"
                          mt={2}
                          style={{ borderTop: "1px solid #E2E8F0", paddingTop: 10 }}
                        >
                          <Text fz="11px" fw={700} c="#64748B">
                            Click to view details
                          </Text>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#64748B"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 12h14"></path>
                            <path d="M12 5l7 7-7 7"></path>
                          </svg>
                        </Group>
                      )}
                    </Stack>
                  </Box>
                </Tooltip>
              );
            })()}
        </ReactLeafletPolygon>
      </Pane>
    );
  },
);
MemoizedCityPolygon.displayName = "MemoizedCityPolygon";

export default function Map({
  boundaries,
  cities,
  year,
  totalDiapersForYear,
  yearlyTotalDiapers,
  selectedYear,
  babiesHelped,
}: MapProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { mapConfig } = useLeafletMap(isMobile ? 7 : DEFAULT_ZOOM);
  const { style: mapStyle, ...mapOptions } = mapConfig;
  const { tileLayerProps } = useBaseTileLayer();
  const [hoveredCityId, setHoveredCityId] = useState<string>();
  const [activeCityId, setActiveCityId] = useState<string>();
  const [activeCityName, setActiveCityName] = useState<string>();
  const [selectedPartnerId, setSelectedPartnerId] = useState<number>();

  const animatedRunningTotal = useCountUp(totalDiapersForYear, 1400);
  const animatedBabiesHelped = useCountUp(yearlyTotalDiapers, 400);

  const activeCityWithStats = cities.find((c) => c.name === activeCityName);

  interface BoundaryPolygon {
    id: string;
    positions: LatLngExpression[][];
    name: string;
    fillColor: string;
    totalDiapers: number;
    area: number;
    center: [number, number];
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

      const positions = feature.geometry.coordinates as unknown as LatLngExpression[][];
      const geomStats = getGeometryStats(positions);

      return {
        id: name || Math.random(),
        positions,
        name: name || "Unknown Region",
        fillColor,
        totalDiapers: total,
        area: geomStats.area,
        center: geomStats.center,
      };
    });
  }, [boundaries, cities]);

  const visibleBoundaries = useMemo(
    () =>
      [...boundaryPolygons]
        .filter((b) => b.totalDiapers > 0 && b.positions && b.positions.length > 0)
        .sort((a, b) => b.area - a.area),
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
      <style>{`.native-town-label { background: transparent !important; border: none !important; box-shadow: none !important; margin: 0 !important; padding: 0 !important; pointer-events: none !important; } .native-town-label::before { display: none !important; }`}</style>
      <MapContainer {...mapOptions} zoomControl={false} style={mapStyle}>
        <ZoomControl position="topleft" />
        <ResetViewControl />
        <TileLayer {...tileLayerProps} />
        {visibleBoundaries.map((boundary, index) => {
          const boundaryId = String(boundary.id || index);
          return (
            <React.Fragment key={boundaryId}>
              <MemoizedCityPolygon
                boundary={boundary}
                index={index}
                boundaryId={boundaryId}
                isEntering={false} // Transition disabled to prevent DOM tearing
                isActive={activeCityId === boundary.id}
                isHovered={hoveredCityId === boundary.id}
                year={year}
                cities={cities}
                isMobile={isMobile}
                setHoveredCityId={setHoveredCityId}
                setActiveCityName={setActiveCityName}
                setActiveCityId={setActiveCityId}
              />
              {boundary.name && typeof window !== "undefined" && (
                <CircleMarker
                  center={boundary.center}
                  radius={0}
                  opacity={1}
                  stroke={false}
                  fillOpacity={0}
                  interactive={false}
                >
                  <Tooltip permanent direction="center" className="native-town-label">
                    <div
                      style={{
                        fontWeight: 800,
                        fontFamily: "inherit",
                        fontSize: "11.5px",
                        color: "#1e293b",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        textShadow:
                          "1px 1px 0 rgba(255,255,255,0.95), -1px -1px 0 rgba(255,255,255,0.95), 1px -1px 0 rgba(255,255,255,0.95), -1px 1px 0 rgba(255,255,255,0.95), 0px 0px 5px rgba(255,255,255,0.9)",
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {boundary.name}
                    </div>
                  </Tooltip>
                </CircleMarker>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      <div
        style={
          isMobile
            ? { display: "contents" } // Allows absolute children to bind to screen
            : {
                position: "absolute",
                top: 16,
                right: 16,
                bottom: 16, // Fill available height for scrolling
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                width: 380, // WIDER!
                pointerEvents: "none", // Let clicks pass through gaps
              }
        }
      >
        {/* Total Diapers Distributed */}
        {!(isMobile && activeCityWithStats) && (
          <Box
            style={{
              position: isMobile ? "absolute" : "relative",
              top: isMobile ? 16 : undefined,
              right: isMobile ? 16 : undefined,
              zIndex: isMobile ? 1000 : undefined,
              pointerEvents: "auto", // Restore pointer events for children if interactive
              background: "#1B3668",
              borderRadius: 12,
              border: "1px solid #E4E7EC",
              boxShadow: "0 8px 32px rgba(27, 54, 104, 0.4)",
              padding: isMobile ? "8px 12px" : "14px 18px",
              width: isMobile ? "auto" : "100%",
            }}
          >
            <Group align="center" wrap="nowrap" gap={isMobile ? 12 : 16}>
              {selectedYear && (
                <>
                  <Stack gap={isMobile ? 2 : 4} style={{ flexShrink: 0 }}>
                    <Text c="#4ade80" fw={800} fz={isMobile ? "18px" : "22px"} lh={1}>
                      +
                      {yearlyTotalDiapers != null
                        ? animatedBabiesHelped.toLocaleString()
                        : "--"}
                    </Text>
                    <Text
                      fz={isMobile ? "11px" : "13px"}
                      fw={500}
                      c="rgba(255,255,255,0.7)"
                      lh={1}
                    >
                      in {selectedYear}
                    </Text>
                  </Stack>
                  <Box
                    style={{
                      flexShrink: 0,
                      width: 1,
                      height: isMobile ? 32 : 42,
                      backgroundColor: "rgba(255,255,255,0.2)",
                    }}
                  />
                </>
              )}
              <Stack gap={isMobile ? 2 : 4} style={{ minWidth: 0 }}>
                <Text fz={isMobile ? "24px" : "28px"} fw={900} c="white" lh={1}>
                  {totalDiapersForYear != null ? animatedRunningTotal.toLocaleString() : "--"}
                </Text>
                <Text fz={isMobile ? "11px" : "13px"} fw={500} c="rgba(255,255,255,0.7)" lh={1.2}>
                  total diapers through {year}
                </Text>
              </Stack>
            </Group>
          </Box>
        )}

        {/* Babies Helped */}
        {!(isMobile && activeCityWithStats) && (
          <Box
            style={{
              position: isMobile ? "absolute" : "relative",
              top: isMobile ? 75 : undefined,
              right: isMobile ? 16 : undefined,
              zIndex: isMobile ? 1000 : undefined,
              pointerEvents: "auto",
              background: "#1B3668",
              borderRadius: 12,
              border: "1px solid #E4E7EC",
              boxShadow: "0 8px 32px rgba(27, 54, 104, 0.4)",
              padding: isMobile ? "8px 12px" : "14px 18px",
              width: isMobile ? "auto" : "100%",
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
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    background: "rgba(255, 255, 255, 0.99)",
                    borderRadius: "12px 12px 0 0",
                    boxShadow: "0 -4px 24px rgba(16, 24, 40, 0.18)",
                    pointerEvents: "auto",
                  }
                : {
                    position: "relative",
                    flex: 1, // takes remaining space
                    minHeight: 0, // allows scrolling within flex child
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    background: "rgba(255, 255, 255, 0.97)",
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(16, 24, 40, 0.12)",
                    backdropFilter: "blur(8px)",
                    pointerEvents: "auto",
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
      </div>

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

      <PartnerDrawer
        partnerId={selectedPartnerId}
        onClose={() => setSelectedPartnerId(undefined)}
        boundaries={boundaries}
      />
    </div>
  );
}
