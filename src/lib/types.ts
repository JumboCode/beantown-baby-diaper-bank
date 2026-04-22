import type * as GeoJSON from "geojson";
import type { City, Partner, Distribution as PrismaDistribution } from "@/generated/prisma/browser";

export type GeoJsonBoundaries = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>;

export type CityWithStats = City & {
  distributions: PrismaDistribution[];
  partners: Partner[];
  stats: {
    historical?: { median: number; p25: number; p75: number } | null;
    runningTotal?: number;
  };
};

// Region polygon (GeoJSON Feature with props)
export type RegionFeatureProps = {
  id: string; // stable region id (e.g., "cambridge", "dorchester")
  name: string; // display name
  centroid: [number, number]; // [lat, lng]
};

// GeoJSON types for regions
// These types are used to define the structure of the region data
// used in the Leaflet map component.
export type RegionFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  RegionFeatureProps
>;

// GeoJSON FeatureCollection of regions
export type RegionsGeoJSON = GeoJSON.FeatureCollection<
  RegionFeature["geometry"],
  RegionFeatureProps
>;

export interface Distribution {
  id: string;
  createdAt: string;
  partnerId: string | null;
  cityId: string | null;
  year: string | null;
  month: string | null;
  numberDiapers: string | null;
  numberChildren: string | null;
  percentage: number | null;
  partner: {
    name: string;
  } | null;
  city: {
    name: string;
  } | null;
}
export const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
