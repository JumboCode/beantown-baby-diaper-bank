import type { RegionsGeoJSON } from "@/lib/types";
export const ALL_PARTNERS = [
  "Arlington EATS",
  "Diaper Depot",
  "Family ACCESS",
  "Lexington Food Pantry",
  "Margaret Fuller Neighborhood House",
  "Middlesex Human Service Agency (MHSA)",
  "People Helping People- Burlington Food Pantry",
  "Project SOUP - Somerville Homeless Coalition",
  "REACH Beyond Domestic Violence",
  "Tufts Wakefield/Melrose",
  "Watertown Food Pantry",
  "WeeCare",
  "Woburn Council of Social Concern",
];

export const baseRegions: RegionsGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-71.064544, 42.362427],
            [-71.054544, 42.362427],
            [-71.054544, 42.372427],
            [-71.064544, 42.372427],
            [-71.064544, 42.362427],
          ],
        ],
      },
      properties: {
        id: "downtown-boston",
        name: "Downtown Boston",
        centroid: [42.367427, -71.059544],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-71.095, 42.345],
            [-71.08, 42.345],
            [-71.08, 42.355],
            [-71.095, 42.355],
            [-71.095, 42.345],
          ],
        ],
      },
      properties: {
        id: "south-end",
        name: "South End",
        centroid: [42.3505, -71.0875],
      },
    },
  ],
};

export const emptyRegions: RegionsGeoJSON = {
  type: "FeatureCollection",
  features: [],
};

export const regionImpact: Record<
  string,
  {
    ChildrenServed: number;
    diapersDelivered: number;
    partnerSites: number;
    fulfillmentRate: number;
  }
> = {
  "downtown-boston": {
    ChildrenServed: 320,
    diapersDelivered: 42000,
    partnerSites: 11,
    fulfillmentRate: 0.86,
  },
  "south-end": {
    ChildrenServed: 210,
    diapersDelivered: 26000,
    partnerSites: 7,
    fulfillmentRate: 0.78,
  },
};
export const regionDetails: Record<
  string,
  {
    description: string;
    partners: string[];
  }
> = {
  "downtown-boston": {
    description:
      "This is a brief description of the Downtown Boston region and its partner organizations. Maybe talk about demographics, needs, or other relevant info. Highlight any unique aspects of diaper distribution in this area.",
    partners: ALL_PARTNERS.slice(5, 11),
  },

  "south-end": {
    description:
      "This is a brief description of the South End region and its partner organizations. Maybe talk about demographics, needs, or other relevant info. Highlight any unique aspects of diaper distribution in this area.",
    partners: ALL_PARTNERS.slice(0, 5),
  },
};
