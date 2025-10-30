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
const Circle = dynamic(
  () => import("react-leaflet").then((m) => m.Circle),
  { ssr: false }
);

// Example city coordinates (roughly)
const cities = [
  { name: "Boston", coords: [42.3601, -71.0589], startYear: 2010, startPopulation: 80},
  { name: "Cambridge", coords: [42.3736, -71.1097], startYear: 2012, startPopulation: 40},
  { name: "Somerville", coords: [42.3876, -71.0995], startYear: 2014, startPopulation: 35},
  { name: "Medford", coords: [42.4184, -71.1062], startYear: 2016, startPopulation: 5},
  { name: "Arlington", coords: [42.4154, -71.1565], startYear: 2018, startPopulation: 60},
  { name: "Brookline", coords: [42.3317, -71.1211], startYear: 2020, startPopulation: 20},
  { name: "Quincy", coords: [42.2529, -71.0023], startYear: 2022, startPopulation: 15},
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
        const baseGrowth = city.startPopulation * yearsActive * 200;
        const cityVariation = (city.coords[0] % 3) * 100; // Small variation between cities
        const impact = Math.round(baseGrowth + cityVariation);
        
        return { ...city, impact, yearsActive };
      });
  }, [year]);

  // Calculate the impact of the largest city in 2040
  const maxImpact = useMemo(() => {
    return Math.max(...cities.map(city => {
      const yearsActive = 2040 - city.startYear;
      const baseGrowth = city.startPopulation * yearsActive * 200;
      const cityVariation = (city.coords[0] % 3) * 100;
      return Math.round(baseGrowth + cityVariation);
    }));
  }, []);

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
            const radius = Math.min(100 + city.impact / 100, 8000);
            
            // Calculate color intensity from a scale of 0 to 1,
            // dependant on current city impact over the largest city impact in 2040 (the greatest any impact will ever be)
            const intensity = city.impact / maxImpact;

            // HSL: hue stays at 200 (blue), saturation foes from 100% to 82%, lightness goes from 70% (light) to 20% (dark)
            const saturation = 100 - (intensity * 18); // 100% → 82%
            const lightness = 85 - (intensity * 52); // 70% → 20%
            const color = `hsl(200, ${saturation}%, ${lightness}%)`;

            return (
              <Circle
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
          max={2040}
          step={0.1}
          marks={[
            { value: 2010, label: "2010" },
            { value: 2015, label: "2015" },
            { value: 2020, label: "2020" },
            { value: 2025, label: "2025" },
            { value: 2030, label: "2030" },
            { value: 2035, label: "2035" },
            { value: 2040, label: "2040" },
          ]}
          size="lg"
          label={null}
        />
      </Box>
    </div>
  );
}

