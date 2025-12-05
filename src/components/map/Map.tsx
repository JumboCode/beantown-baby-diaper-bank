"use client";

import dynamic from "next/dynamic";
import { useLeafletMap } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
import { useState, useEffect, useMemo } from "react";
import type { City, Distribution } from "@/generated/prisma/client";
import { Popup, TileLayer, Polygon, MapContainer } from "react-leaflet";
import { Icon, LatLngExpression } from "leaflet";
import { InfoDisplayer } from "../sprint2/DotPopUps";

import "leaflet/dist/leaflet.css";
import type { MapData } from "@/app/main/page";

// Dynamically import react-leaflet components with SSR disabled
// because they depend on the browser environment (e.g., window, document).

const LEVEL_COLORS = [
  "#B2E5FF",
  "#7EC3E5",
  "#51A3CC",
  "#2C85B2",
  "#0F6B99",
];

const getColor = (value: number, max: number) => {
  if (value === 0 || max === 0) return LEVEL_COLORS[0];
  const ratio = value / max;
  if (ratio > 0.8) return LEVEL_COLORS[4];
  if (ratio > 0.6) return LEVEL_COLORS[3];
  if (ratio > 0.4) return LEVEL_COLORS[2];
  if (ratio > 0.2) return LEVEL_COLORS[1];
  return LEVEL_COLORS[0];
};

export const Marker = dynamic(
  () => import("react-leaflet").then((module) => module.Marker),
  { ssr: false }
);

type Coordinates = {
  cityId: number;
  cityName: string;
  lat: number;
  lng: number;
};

type PartnerInfoType = {
  id: number;
  name: string;
  logo_url?: string | null;
};

type CityMapInfo = City & {
  distributions: Distribution[];
  partners: PartnerInfoType[];
};

export default function LeafletMap({ mapData }: { mapData?: MapData | null }) {
  const { mapConfig } = useLeafletMap();
  const { style: mapStyle, ...mapOptions } = mapConfig;
  const { tileLayerProps } = useBaseTileLayer();
  const [cities, setCities] = useState<CityMapInfo[]>([]);
  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);

  const customIcon = new Icon({
    iconUrl: "/marker.svg",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });

  useEffect(() => {
    if (!mapData) return;
    setCities(mapData.cities.data);

    const centroids = mapData.centroids.features;
    const validCoordinates: Coordinates[] = centroids
      .map((feature) => {
        if (!feature["properties"] || !feature["geometry"]) return null;
        return {
          cityId: feature["properties"]["id"],
          cityName: feature["properties"]["name"],
          lng: feature["geometry"]["coordinates"][0],
          lat: feature["geometry"]["coordinates"][1],
        };
      })
      .filter((coordinate): coordinate is Coordinates => coordinate !== null);
    setCoordinates(validCoordinates);
  }, [mapData]);

  const boundaryPolygons = useMemo(() => {
    if (!mapData?.boundaries) return [];

    let maxDiapers = 0;
    const cityTotals: Record<string, number> = {};

    cities.forEach((city) => {
      const total = city.distributions.reduce(
        (sum, d) => sum + Number(d.numberDiapers),
        0
      );
      if (city.name) cityTotals[city.name] = total;
      if (total > maxDiapers) maxDiapers = total;
    });

    return mapData.boundaries.features.map((feature) => {
      const name = feature.properties?.name;
      // Look up the total using the name, default to 0
      const total = name ? cityTotals[name] || 0 : 0;
      
      return {
        id: name || Math.random(),
        positions: feature.geometry.coordinates as unknown as LatLngExpression[][],
        name: name,
        fillColor: getColor(total, maxDiapers),
        totalDiapers: total
      };
    });
  }, [mapData, cities]);

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        zIndex: 0,
      }}>
      <MapContainer
        {...mapOptions}
        style={mapStyle}>
        <TileLayer {...tileLayerProps} />
        {boundaryPolygons.map((boundary, index) => (
          <Polygon
            key={boundary.id || index}
            pathOptions={{
              color: "#2C85B2",
              weight: 2,
              fillColor: boundary.fillColor, 
              fillOpacity: 0.5,
            }}
            positions={boundary.positions}
          >
            {boundary.name && <Popup>{boundary.name}</Popup>}
          </Polygon>
        ))}
        {cities &&
          coordinates &&
          coordinates.map((city) => {
            console.log(cities);
            console.log("Mapping city:", city);
            const cityInfo = cities.find(
              (info) => Number(info.id) === city.cityId
            );
            const partnerNames = cityInfo?.partners.map((p) => p.name);
            // const partnerLogos = cityInfo?.partners.map(p => p.logo_url).filter(Boolean);
            const totalDiapers =
              cityInfo?.distributions.reduce(
                (sum, d) => sum + Number(d.numberDiapers),
                0
              ) ?? 0;
            const totalChildren =
              cityInfo?.distributions.reduce(
                (sum, d) => sum + Number(d.numberChildren),
                0
              ) ?? 0;
            return (
              <Marker
                key={city.cityId}
                position={{ lat: city.lat, lng: city.lng }}
                icon={customIcon}>
                <Popup minWidth={280}>
                  <InfoDisplayer
                    cityName={cityInfo?.name}
                    numDiapers={totalDiapers}
                    childrenHelped={totalChildren}
                    partnerOrgs={partnerNames}
                  />
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}