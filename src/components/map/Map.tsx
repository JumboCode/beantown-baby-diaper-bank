"use client";

import dynamic from "next/dynamic";
import { useLeafletMap } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
import { useState, useEffect } from "react";
import type { City, Distribution } from "@/generated/prisma/client";
import { Popup, TileLayer } from "react-leaflet";
import { Icon } from "leaflet";
import { InfoDisplayer } from "../sprint2/DotPopUps";
import PartnerInfo from "@/app/epic2sprint1/partnerInfo";

import "leaflet/dist/leaflet.css";
import { MapContainer } from "react-leaflet";

// Dynamically import react-leaflet components with SSR disabled
// because they depend on the browser environment (e.g., window, document).

export const Marker = dynamic(
  () => import("react-leaflet").then((module) => module.Marker),
  { ssr: false }
);

/*

export class LatLng {
    constructor(latitude: number, longitude: number, altitude?: number);
    equals(otherLatLng: LatLngExpression, maxMargin?: number): boolean;
    toString(): string;
    distanceTo(otherLatLng: LatLngExpression): number;
    wrap(): LatLng;
    toBounds(sizeInMeters: number): LatLngBounds;
    clone(): LatLng;

    lat: number;
    lng: number;
    alt?: number | undefined;
}

*/

type Coordinates = {
  cityId: number;
  cityName: string;
  lat: number;
  lng: number;
};

type PartnerInfo = {
  id: number,
  name: string,
}

type CityMapInfo = City & {
  distributions: Distribution[],
  partners: PartnerInfo[],
}

export default function LeafletMap() {
  const { mapConfig } = useLeafletMap();
  const { style: mapStyle, ...mapOptions } = mapConfig;
  const { tileLayerProps } = useBaseTileLayer();
  const [cities, setCities] = useState<CityMapInfo[]>([]);
  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);

  // Use leaflet's Icon class to create a custom icon
  // See https://leafletjs.com/reference.html#icon for more details
  const customIcon = new Icon({
    iconUrl: "/marker.svg",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });

  useEffect(() => {
    const fetchCities = async () => {
      const response = await fetch("/api/cities");
      const data = await response.json();
      setCities(data.data);
    };
    fetchCities();
  }, []);

  useEffect(() => {
    const updateCoordinates = async () => {
      if (cities.length === 0) return;
      const coordinatePromises = cities.map((city) =>
        getCoordinates(city.name)
      );
      const coordinateRes = await Promise.all(coordinatePromises);
      const validCoordinates = coordinateRes.filter(
        (coordinate) => coordinate !== undefined
      );
      setCoordinates(validCoordinates);
    };
    updateCoordinates();
  }, [cities]);

  useEffect(() => {
    console.log("latest coordinates", coordinates);
  }, [coordinates]);

  const getCoordinates = async (name: string | null) => {
    if (name) {
      const response = await fetch(`/api/cities/centroids?name=${name}`);
      const data = await response.json();
      return {
        cityId: data["properties"]["id"],
        cityName: data["properties"]["name"],
        lng: data["geometry"]["coordinates"][0],
        lat: data["geometry"]["coordinates"][1],
      };
    }
  };

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
            const cityInfo = cities.find(info => Number(info.id) === city.cityId);
            const partnerNames = cityInfo?.partners.map(partner => partner.name);
            return (
              <Marker
                key={city.cityId}
                position={{ lat: city.lat, lng: city.lng }}
                icon={customIcon}>
                <Popup minWidth={280}>
                  <InfoDisplayer 
                    cityName={cityInfo?.name}
                    numDiapers={300}
                    childrenHelped={300}
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
