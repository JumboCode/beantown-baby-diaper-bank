"use client";

import dynamic from "next/dynamic";
import { useLeafletMap } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
import { useState, useEffect } from "react";
import type { City } from "@/generated/prisma/client";

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

export const Popup = dynamic(
  () => import("react-leaflet").then((module) => module.Popup),
  { ssr: false }
);

const MapContainer = dynamic(
  () => import("react-leaflet").then((module) => module.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((module) => module.TileLayer),
  { ssr: false }
);

type coordinates = {
  cityId: number,
  cityName: string,
  lat: number,
  lng: number,
};

export default function LeafletMap() {
  const { mapConfig } = useLeafletMap();
  const { style: mapStyle, ...mapOptions } = mapConfig;
  const { tileLayerProps } = useBaseTileLayer();
  const [cities, setCities] = useState<City[]>([]);
  const [coordinates, setCoordinates] = useState<coordinates[]>([]);

  useEffect( () => {
    const fetchCities = async() => {
      const response = await fetch("/api/cities");
      const data = await response.json();
      setCities(data.data);
    }
    fetchCities();
  }, [])

  useEffect(() => {
    const updateCoordinates = async() => {
      if (cities.length === 0) return;
      const coordinatePromises = cities.map((city) => getCoordinates(city.name));
      const coordinateRes = await Promise.all(coordinatePromises);
      const validCoordinates = coordinateRes.filter((coordinate) => coordinate !== undefined);
      setCoordinates(validCoordinates);
    }
    updateCoordinates();
  }, [cities]);

  useEffect(() => {
    console.log('latest coordinates', coordinates);
  }, [coordinates])

  const getCoordinates = async (name: string | null) => {
    if (name) {
      const response = await fetch(`/api/cities/centroids?name=${name}`);
      const data = await response.json();
      return {
        cityId: data['properties']['id'],
        cityName: data['properties']['name'],
        lat: data['geometry']['coordinates'][0], 
        lng: data['geometry']['coordinates'][1]
      };
    }
  }

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
        {(cities && coordinates) &&
        coordinates.map(city => {
          return (
            <Marker key={city.cityId} position={{lat: city.lat, lng: city.lng}}>
              <Popup>
                {city.cityName}
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  );
}
