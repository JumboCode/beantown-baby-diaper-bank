"use client";

import { useState } from "react";
import { Slider } from "@mantine/core";
import LeafletMap from "@/components/map/LeafletMap";
import { baseRegions, regionImpact, regionDetails } from "@/data/map-data";

export default function RakshiElchinMap() {
    const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

    const onRegionClick = (regionId: string) => {
        setSelectedRegionId(regionId);
    };

    const impact = selectedRegionId ? regionImpact[selectedRegionId] : undefined;
    const details = selectedRegionId ? regionDetails[selectedRegionId] : undefined;

    const [timelineValue, setTimelineValue] = useState<number>(2024);

    return (
        <div style={{ display: "flex", gap: "1rem", height: "520px" }}>
            <div style={{ flex: 1, minHeight: 0 }}>
                    {/* Sample point GeoJSON with diaper distribution locations across Boston.
                            Replace or extend this inline JSON with real data as needed. Each point
                            has a `diapersDistributed` property which controls the marker size.

                            Where to insert a diaper icon:
                            - If you'd like to use a custom icon instead of circle markers, update
                                `LeafletMap.tsx` to render a `Marker` with a custom `L.icon` or a
                                `DivIcon` containing an <img> of a diaper SVG. The comment in
                                `LeafletMap.tsx` (Option B) shows where to switch to a Marker.
                    */}

                    <LeafletMap regions={baseRegions} onRegionClick={onRegionClick} points={{
                        type: "FeatureCollection",
                        features: [
                            // <10K
                            { type: "Feature", geometry: { type: "Point", coordinates: [-71.091, 42.362] }, properties: { id: "west-end", name: "West End", diapersDistributed: 8000 } },
                            { type: "Feature", geometry: { type: "Point", coordinates: [-71.12, 42.373] }, properties: { id: "cambridge-edge", name: "Cambridge Edge", diapersDistributed: 1500 } },
                            { type: "Feature", geometry: { type: "Point", coordinates: [-71.14, 42.39] }, properties: { id: "somerville-east", name: "Somerville East", diapersDistributed: 3000 } },
                            { type: "Feature", geometry: { type: "Point", coordinates: [-71.067, 42.377] }, properties: { id: "charles-river", name: "Charles River", diapersDistributed: 450 } },

                            // 10K-50K
                            { type: "Feature", geometry: { type: "Point", coordinates: [-71.06, 42.347] }, properties: { id: "south-boston", name: "South Boston", diapersDistributed: 23000 } },
                            { type: "Feature", geometry: { type: "Point", coordinates: [-71.05, 42.375] }, properties: { id: "north-end", name: "North End", diapersDistributed: 12000 } },
                            { type: "Feature", geometry: { type: "Point", coordinates: [-71.09, 42.345] }, properties: { id: "dorchester", name: "Dorchester", diapersDistributed: 15000 } },
                            { type: "Feature", geometry: { type: "Point", coordinates: [-71.115, 42.353] }, properties: { id: "allston", name: "Allston", diapersDistributed: 42000 } },

                            // 50K-100K
                            { type: "Feature", geometry: { type: "Point", coordinates: [-71.01, 42.373] }, properties: { id: "quincy", name: "Quincy", diapersDistributed: 75000 } },
                            { type: "Feature", geometry: { type: "Point", coordinates: [-71.15, 42.28] }, properties: { id: "braintree", name: "Braintree", diapersDistributed: 65000 } },

                            // 100K+
                            { type: "Feature", geometry: { type: "Point", coordinates: [-71.0589, 42.3601] }, properties: { id: "boston-center", name: "Boston Center", diapersDistributed: 120000 } },
                            { type: "Feature", geometry: { type: "Point", coordinates: [-71.10, 42.30] }, properties: { id: "cambridge-hub", name: "Cambridge Hub", diapersDistributed: 200000 } },
                        ],
            }} timelineValue={timelineValue} />
            </div>

            <aside style={{ width: 320 }}>
                <div style={{ padding: "1rem", border: "1px solid #e6e6e6", borderRadius: 8 }}>
                    <h3 style={{ marginTop: 0 }}>Region details</h3>
                    {selectedRegionId ? (
                        <div>
                            <strong>{selectedRegionId}</strong>
                            {impact && (
                                <ul>
                                    <li>Children served: {impact.ChildrenServed}</li>
                                    <li>Diapers delivered: {impact.diapersDelivered}</li>
                                    <li>Partner sites: {impact.partnerSites}</li>
                                    <li>Fulfillment rate: {Math.round(impact.fulfillmentRate * 100)}%</li>
                                </ul>
                            )}
                            {details && <p>{details.description}</p>}
                        </div>
                    ) : (
                        <p>Click a region on the map to view details.</p>
                    )}
                </div>
                <div style={{ marginTop: 16, padding: "1rem", border: "1px solid #e6e6e6", borderRadius: 8 }}>
                    <h4 style={{ marginTop: 0 }}>Distribution legend</h4>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 18, height: 18, background: "#39FF14", display: "inline-block", borderRadius: 4 }} />
                            <span>100K+ (neon)</span>
                        </li>
                        <li style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                            <span style={{ width: 18, height: 18, background: "#ff4d4d", display: "inline-block", borderRadius: 4 }} />
                            <span>50K - 100K (red)</span>
                        </li>
                        <li style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                            <span style={{ width: 18, height: 18, background: "#00cc00", display: "inline-block", borderRadius: 4 }} />
                            <span>10K - 50K (green)</span>
                        </li>
                        <li style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                            <span style={{ width: 18, height: 18, background: "#6699ff", display: "inline-block", borderRadius: 4 }} />
                            <span>&lt; 10K (blue)</span>
                        </li>
                    </ul>
                </div>
                <div style={{ marginTop: 16, padding: "1rem", border: "1px solid #e6e6e6", borderRadius: 8 }}>
                    <h4 style={{ marginTop: 0 }}>Timeline (dummy)</h4>
                    <Slider
                        min={2018}
                        max={2025}
                        value={timelineValue}
                        onChange={setTimelineValue}
                    />
                    <div style={{ marginTop: 8 }}>Year: {timelineValue}</div>
                </div>
            </aside>
        </div>
    );
}