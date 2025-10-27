"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Slider, Text, Box } from "@mantine/core";
import "leaflet/dist/leaflet.css";

// Dynamically import Leaflet components
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((m) => m.CircleMarker),
  { ssr: false }
);

// Example city coordinates (roughly)
const cities = [
  { name: "Boston", coords: [42.3601, -71.0589], startYear: 2010 },
  { name: "Cambridge", coords: [42.3736, -71.1097], startYear: 2012 },
  { name: "Somerville", coords: [42.3876, -71.0995], startYear: 2014 },
  { name: "Medford", coords: [42.4184, -71.1062], startYear: 2016 },
  { name: "Arlington", coords: [42.4154, -71.1565], startYear: 2018 },
  { name: "Brookline", coords: [42.3317, -71.1211], startYear: 2020 },
  { name: "Quincy", coords: [42.2529, -71.0023], startYear: 2022 },
];
export default function AshValentinaMap() {
  const [year, setYear] = useState(2010);

  // Fake diaper distribution data that grows over time
  const cityData = useMemo(() => {
    return cities
      .filter((city) => year >= city.startYear) // Only show cities after their start year
      .map((city) => {
        // Years since this city started
        const yearsActive = year - city.startYear;
        
        // Simple linear growth with some variation per city
        const baseGrowth = yearsActive * 200;
        const cityVariation = (city.coords[0] % 3) * 100; // Small variation between cities
        const impact = Math.round(baseGrowth + cityVariation);
        
        return { ...city, impact, yearsActive };
      });
  }, [year]);

  return (
    <div className="flex flex-col w-full">
      <div className="h-[80vh] w-full">
        <MapContainer
          center={[42.3736, -71.1097]} // Greater Boston center
          zoom={11}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          />

          {/* Dynamic circle markers */}
          {cityData.map((city) => {
            // Steady growth: starts at 3px, grows to 80px
            const radius = Math.min(3 + city.impact / 50, 80);
            
            // Color intensity based on impact
            const intensity = Math.min(1, city.impact / 5000);
            const color = "#2c85b2";

            return (
              <CircleMarker
                key={city.name}
                center={city.coords as [number, number]}
                radius={radius}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.6,
                  weight: 2,
                }}
              />
            );
          })}
        </MapContainer>
      </div>

      <Box>
        <Slider
          value={year}
          color="#2c85b2"
          onChange={setYear}
          min={2010}
          max={2025}
          step={1}
          marks={[
            { value: 2010, label: "2010" },
            { value: 2015, label: "2015" },
            { value: 2020, label: "2020" },
            { value: 2025, label: "2025" },
          ]}
          size="lg"
          label={null}
        />
      </Box>
    </div>
  );
}

