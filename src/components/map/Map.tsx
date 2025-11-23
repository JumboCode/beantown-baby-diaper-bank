"use client";

import dynamic from "next/dynamic";
import { useLeafletMap } from "./useLeafletMap";
import { useBaseTileLayer } from "./useBaseTileLayer";
import { useState, useEffect, useMemo } from "react";
import type { City, Distribution } from "@/generated/prisma/client";
import { Popup, TileLayer } from "react-leaflet";
import { Icon } from "leaflet";
import { InfoDisplayer } from "../sprint2/DotPopUps";

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

type PartnerInfoType = {
  id: number;
  name: string;
  logo_url?: string | null;
};

type CityMapInfo = City & {
  distributions: Distribution[];
  partners: PartnerInfoType[];
};


export default function LeafletMap({
  view,
  index,
  labels,
  mapData,

} : {
  view: "monthly" | "yearly";
  index: number;
  labels: (string | number)[];
  mapData?: CityMapInfo[];
}) {
  const { mapConfig } = useLeafletMap();
  const { style: mapStyle, ...mapOptions } = mapConfig;
  const { tileLayerProps } = useBaseTileLayer();
  const [cities, setCities] = useState<CityMapInfo[]>([]);
  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);
  // const GeoJSON = dynamic(() => import("react-leaflet").then(m => m.GeoJSON), { ssr: false });
  // const [regions, setRegions] = useState<RegionsGeoJSON>();
  // const [choroplethData, setChoroplethData] = useState<Record<string, number>>({});

  // Use leaflet's Icon class to create a custom icon
  // See https://leafletjs.com/reference.html#icon for more details
  const customIcon = new Icon({
    iconUrl: "/marker.svg",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });

  const { monthParam, yearParam } = useMemo(() => {
    const currentLabel = labels?.[index];
    if (view === "monthly" && currentLabel) {
      const [month, year] = String(currentLabel).split(" ");
      return { monthParam: month, yearParam: year };
    }
    if (view === "yearly" && currentLabel) {
      return { monthParam: undefined, yearParam: String(currentLabel) };
    }
    return { monthParam: undefined, yearParam: undefined };
  }, [labels, index, view]);
  

  useEffect(() => {
    if (mapData !== undefined && mapData !== null) {
      setCities(mapData);
      return;
    }
    if (view === "yearly" && !yearParam) return;
    if (view === "monthly" && (!monthParam || !yearParam)) return;

    const fetchCities = async () => {
      const params = new URLSearchParams();
      if (monthParam) params.set("month", monthParam);
      if (yearParam) params.set("year", yearParam);
      const qs = params.toString();
      const response = await fetch(`/api/cities${qs ? `?${qs}` : ""}`);
      const data = await response.json();
      setCities(data.data);
    };
    fetchCities();
  }, [mapData, monthParam, yearParam, view]);

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
            const partnerNames = cityInfo?.partners.map(p => p.name);
            // const partnerLogos = cityInfo?.partners.map(p => p.logo_url).filter(Boolean);
            const totalDiapers = cityInfo?.distributions.reduce((sum, d) => sum + d.numberDiapers, 0) ?? 0;
            const totalChildren = cityInfo?.distributions.reduce((sum, d) => sum + d.numberChildren, 0) ?? 0;
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
                    // partnerLogos={partnerLogos}
                  />
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
