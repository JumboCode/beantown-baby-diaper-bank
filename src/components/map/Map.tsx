"use client";

import dynamic from "next/dynamic";
import { useLeafletMap } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
import { useState, useEffect } from "react";
import type { City, Distribution } from "@/generated/prisma/client";
import { Popup, TileLayer } from "react-leaflet";
import { Icon } from "leaflet";
import { InfoDisplayer } from "../sprint2/DotPopUps";

import "leaflet/dist/leaflet.css";
import { MapContainer } from "react-leaflet";
import type { MapData } from "@/app/main/page";

// Dynamically import react-leaflet components with SSR disabled
// because they depend on the browser environment (e.g., window, document).

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