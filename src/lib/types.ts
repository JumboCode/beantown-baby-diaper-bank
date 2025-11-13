import type * as GeoJSON from "geojson";

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
