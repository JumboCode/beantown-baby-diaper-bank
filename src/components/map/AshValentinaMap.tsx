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
  const [year, setYear] = useState(2015);

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
            const color = `rgba(${255 - 150 * intensity}, ${50 * intensity}, 0, 0.8)`;

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
        />
        <Text mt="md" ta="center">
          Year: <b>{year}</b>
        </Text>
      </Box>
    </div>
  );
}


// "use client";

// import { useState, useEffect } from "react";
// import dynamic from "next/dynamic";
// import { Slider, Text, Box } from '@mantine/core';
// import L from "leaflet";

// // Dynamically import MapContainer and TileLayer (for SSR safety)
// const MapContainer = dynamic(
//   () => import("react-leaflet").then((m) => m.MapContainer),
//   { ssr: false }
// );

// const TileLayer = dynamic(
//   () => import("react-leaflet").then((m) => m.TileLayer),
//   { ssr: false }
// );

// const marks = Array.from({ length: 11 }, (_, i) => ({
//   value: i * 10,
//   label: String(2015 + i),
// }));

// export default function AshValentinaMap() {

//   const [value, setValue] = useState(2010);

//   return (
//     <div className="flex flex-col w-full">
//       <div className="h-[80vh] w-full">
//         <MapContainer
//           center={[42.3736, -71.1097]} // Centered roughly on Cambridge, MA
//           zoom={12}
//           style={{ height: "100%", width: "100%" }}>
//           <TileLayer
//             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//             attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
//           />
//         </MapContainer>
//       </div>

//       <Box maw={400} mx="auto">
//       <Slider 
//       value={value}
//       onChange={setValue}
//       min={2000}
//       max={2025}
//       />

//       <Text mt="md" size="sm">
//         onChange value: <b>{value}</b>
//       </Text>
//     </Box>
//     </div>
    
//   );
// }