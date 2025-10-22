"use client";

import dynamic from "next/dynamic";
import { Slider } from '@mantine/core';

// Dynamically import MapContainer and TileLayer (for SSR safety)
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);

export default function AshValentinaMap() {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[42.3736, -71.1097]} // Centered roughly on Cambridge, MA
        zoom={12}
        style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        />
      </MapContainer>

      <Slider
      color="blue"
      defaultValue={40}
      marks={[
        { value: 0, label: '2010' },
        { value: 33, label: '2015' },
        { value: 66, label: '2020' },
        { value: 100, label: '2025' },
      ]}
    />
    </div>
  );
}