"use client";

import { useState, useMemo, useEffect } from "react";
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

interface FallingDiaperProps {
  id: string;
  left: number;
  delay: number;
  duration: number;
}
function FallingDiaper({ id, left, delay, duration }: FallingDiaperProps) {
  return (
    <div
      key={id}
      className="absolute text-4xl pointer-events-none"
      style={{
        left: `${left}%`,
        top: '-50px',
        animation: `fall ${duration}s linear ${delay}s`,
        animationFillMode: 'forwards',
      }}
    >
      🩲
    </div>
  );
}
export default function AshValentinaMap() {
  const [year, setYear] = useState(2005);
  const [celebratingCities, setCelebratingCities] = useState(new Set());
  const [diapers, setDiapers] = useState<FallingDiaperProps[]>([]);

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

    // Check for milestone celebrations
  useEffect(() => {
    const MILESTONE = 100000; // Celebrate at 10,000 diapers
    
    cityData.forEach((city) => {
      const justHitMilestone = city.impact >= MILESTONE && !celebratingCities.has(city.name);
      const justLostMilestone = city.impact < MILESTONE && celebratingCities.has(city.name);
      
      if (justHitMilestone) {
        // Mark this city as celebrating
        setCelebratingCities(prev => {
          const newSet = new Set(prev);
          newSet.add(city.name);
          return newSet;
        });
        
        // Create falling diapers
        const newDiapers = Array.from({ length: 30 }, (_, i) => ({
          id: `${city.name}-${Date.now()}-${i}`,
          left: Math.random() * 100,
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 1,
        }));
        
        setDiapers((prev: FallingDiaperProps[]) => [...prev, ...newDiapers]);
        
        // Remove diapers after animation
        setTimeout(() => {
          setDiapers(prev => prev.filter(d => !d.id.startsWith(city.name)));
        }, 4000);
      }
      else if (justLostMilestone) {
        setCelebratingCities(prev => {
          const newSet = new Set(prev);
          newSet.delete(city.name);
          return newSet;
        });
      }
    });
  }, [cityData, celebratingCities]);

  // Calculate the impact of the largest city in 2040
  const maxImpact = useMemo(() => {
    return Math.max(...cities.map(city => {
      const yearsActive = 2025 - city.startYear;
      const baseGrowth = city.startPopulation * yearsActive * 200;
      const cityVariation = (city.coords[0] % 3) * 100;
      return Math.round(baseGrowth + cityVariation);
    }));
  }, []);

  return (
    <div className="flex flex-col w-full">
      <style jsx>{`
      @keyframes fall {
        to {
          transform: translateY(100vh) rotate(360deg);
          opacity: 0;
        }
      }
    `}</style>
      <div className="h-[80vh] w-full relative">
        <div className="absolute inset-0 z-[1000] pointer-events-none">
          {/* Falling diapers */}
          {diapers.map((diaper) => (
            <FallingDiaper key={diaper.id} {...diaper} />
          ))}
        </div>

        <MapContainer
          center={[42.4000, -71.0200]} // Greater Boston center
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
          const radius = Math.min(100 + city.impact / 50, 8000);
           
          // Calculate color intensity from a scale of 0 to 1,
          // dependant on current city impact over the largest city impact in 2025 (the greatest any impact will ever be)
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

        {/* Legend with Key and Scale */}
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1000] max-w-xs">
          <Text size="sm" fw={700} mb={8}>
            Diaper Distribution by City
          </Text>
          
          <div className="space-y-1.5 mb-3">
            {cityData.map((city) => {
              const intensity = city.impact / maxImpact;
              const lightness = 70 - (intensity * 50);
              const color = `hsl(200, 80%, ${lightness}%)`;
              
              return (
                <div key={city.name} className="flex items-center justify-between">
                  {/* Create the icon representing the color of the city */}
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-full border-2"
                      style={{ 
                        backgroundColor: color,
                        borderColor: color
                      }}
                    />
                    <Text size="xs">{city.name}</Text>
                  </div>
                  <Text size="xs" fw={500}>
                    {city.impact.toLocaleString()}
                  </Text>
                </div>
              );
            })}
            {/* Return if no cities are shown */}
            {cityData.length === 0 && (
              <Text size="sm" c="dimmed">
                No cities active yet
              </Text>
            )}
          </div>
          
          {/* Create the color gradiant scale */}
          <div className="border-t pt-2 mt-2">
            <Text size="xs" fw={600} mb={6}>
              Color Scale
            </Text>
            <div 
              className="w-full h-3 rounded mb-2"
              style={{
                background: 'linear-gradient(to right, hsl(200, 100%, 85%), hsl(200, 82%, 33%))'
              }}
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>Low Impact</span>
              <span>High Impact</span>
            </div>
          </div>
        </div>
      </div>

      <Box>
        <Slider
          value={year}
          color="#2c85b2"
          onChange={setYear}
          min={2005}
          max={2025}
          step={0.1}
          marks={[
            { value: 2005, label: "2005" },
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

