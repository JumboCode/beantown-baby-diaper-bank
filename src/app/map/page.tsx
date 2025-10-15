"use client";
import LeafletMap from "@/components/map/LeafletMap";
import { RegionsGeoJSON } from "@/lib/types";

export default function MapPage() {
  // Temporary sample region polygon (roughly downtown Boston) for map testing
  const regions: RegionsGeoJSON = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-71.064544, 42.362427],
              [-71.054544, 42.362427],
              [-71.054544, 42.372427],
              [-71.064544, 42.372427],
              [-71.064544, 42.362427],
            ],
          ],
        },
        properties: {
          id: "downtown-boston",
          name: "Downtown Boston",
          centroid: [42.367427, -71.059544],
        },
      },
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-71.078, 42.347],
              [-71.068, 42.347],
              [-71.068, 42.357],
              [-71.078, 42.357],
              [-71.078, 42.347],
            ],
          ],
        },
        properties: {
          id: "south-end",
          name: "South End",
          centroid: [42.352, -71.073],
        },
      },
    ],
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="w-full h-[100vh]">
        <LeafletMap
          regions={regions}
          onRegionClick={(regionId) => {
            console.log("Region clicked:", regionId);
          }}
          onRegionHover={(regionId) => {
            console.log("Region hovered:", regionId);
          }}
        />
      </div>
    </div>
  );
}
