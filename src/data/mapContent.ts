export type BasicPartnerSite = {
  id: string;
  name: string;
  regionId?: string;
  address: string;
  description?: string;
  start_partnering_date?: string; // ISO date string
  regionsServed?: string[];
};

export const distributionSummary = {
  delivered: 98500,
  goal: 130000,
  ChildrenServed: 1280,
  partnerCount: 28,
  yoyGrowth: 21,
};

export const partnerSites: BasicPartnerSite[] = [
  {
    id: "site-boston-1",
    name: "Beacon Family Hub",
    regionId: "boston",
    address: "75 Tremont St, Boston, MA 02108",
    description:
      "Downtown drop-in center pairing diaper support with housing navigation.",
    start_partnering_date: "2019-03-12",
    regionsServed: ["boston", "dorchester"],
  },
  {
    id: "site-boston-2",
    name: "Harbor Community Closet",
    regionId: "boston",
    address: "90 Warren St, Boston, MA 02119",
    description:
      "Neighborhood closet providing diapers, wipes, and formula stipends.",
    start_partnering_date: "2022-01-25",
    regionsServed: ["boston", "dorchester"],
  },
  {
    id: "site-cambridge-1",
    name: "Cambridge Care Collective",
    regionId: "cambridge",
    address: "45 Pearl St, Cambridge, MA 02139",
    description:
      "Collective coordinating bilingual outreach for immigrant caregivers.",
    start_partnering_date: "2020-06-04",
    regionsServed: ["cambridge"],
  },
  {
    id: "site-cambridge-2",
    name: "Port Family Resource Center",
    regionId: "cambridge",
    address: "64 Portland St, Cambridge, MA 02139",
    description:
      "Resource center linking diaper distribution with early childhood screenings.",
    start_partnering_date: "2021-11-18",
    regionsServed: ["cambridge", "somerville"],
  },
  {
    id: "site-somerville-1",
    name: "Somerville Neighborhood Initiative",
    regionId: "somerville",
    address: "337 Somerville Ave, Somerville, MA 02143",
    description:
      "Mobile pop-up serving working caregivers with evening pick-up hours.",
    start_partnering_date: "2018-08-09",
    regionsServed: ["somerville", "cambridge"],
  },
  {
    id: "site-brookline-1",
    name: "Brookline Parent Collective",
    regionId: "brookline",
    address: "142 Harvard St, Brookline, MA 02446",
    description:
      "Collective of mutual-aid captains coordinating porch drop-offs.",
    start_partnering_date: "2020-02-14",
    regionsServed: ["brookline", "boston"],
  },
  {
    id: "site-dorchester-1",
    name: "Dorchester Family Pantry",
    regionId: "dorchester",
    address: "110 Columbia Rd, Dorchester, MA 02121",
    description:
      "Pantry pairing diaper access with prenatal vitamins and car-seat checks.",
    start_partnering_date: "2017-05-30",
    regionsServed: ["dorchester"],
  },
];

export const regionImpact: Record<
  string,
  {
    ChildrenServed: number;
    diapersDelivered: number;
    partnerSites: number;
    fulfillmentRate: number;
  }
> = {
  boston: {
    ChildrenServed: 540,
    diapersDelivered: 36500,
    partnerSites: 12,
    fulfillmentRate: 0.88,
  },
  cambridge: {
    ChildrenServed: 210,
    diapersDelivered: 14200,
    partnerSites: 6,
    fulfillmentRate: 0.83,
  },
  brookline: {
    ChildrenServed: 135,
    diapersDelivered: 9200,
    partnerSites: 4,
    fulfillmentRate: 0.79,
  },
  somerville: {
    ChildrenServed: 180,
    diapersDelivered: 11800,
    partnerSites: 5,
    fulfillmentRate: 0.85,
  },
  dorchester: {
    ChildrenServed: 215,
    diapersDelivered: 26800,
    partnerSites: 7,
    fulfillmentRate: 0.74,
  },
};

export const regionDetails: Record<
  string,
  {
    narrative: string;
    recentDeliveries: number;
    volunteerHours: number;
    topNeeds: string[];
    partners: string[];
    upcomingEvents: string[];
  }
> = {
  boston: {
    narrative:
      "Boston partners coordinate weekly drop-ins at shelters and Roxbury YMCAs. Transit stipends help caregivers pair diaper pickups with medical appointments.",
    recentDeliveries: 8300,
    volunteerHours: 280,
    topNeeds: ["Size 4 diapers", "Overnight pull-ups", "Sensitive wipes"],
    partners: [
      "Beacon Family Hub",
      "Harbor Community Closet",
      "Boston Health Alliance",
    ],
    upcomingEvents: [
      "Mar 4 – Pop-up pick-up at Madison Park Community Center",
      "Apr 12 – Corporate employee pack-a-thon (250 volunteers)",
    ],
  },
  cambridge: {
    narrative:
      "Cambridge hubs lean on bilingual volunteers to serve Central and Port neighborhoods. Demand spikes near the start of each academic term.",
    recentDeliveries: 4200,
    volunteerHours: 160,
    topNeeds: ["Size 1 diapers", "Diaper cream", "Formula vouchers"],
    partners: [
      "Cambridge Care Collective",
      "Port Family Resource Center",
      "Cambridge Health Alliance Outreach",
    ],
    upcomingEvents: [
      "Feb 29 – Baby essentials fair at Cambridge Community Center",
      "Mar 22 – Parent leadership roundtable",
    ],
  },
  brookline: {
    narrative:
      "Brookline neighbors run porch-drop routes so caregivers without cars can receive supplies discreetly within 24 hours of texting the hotline.",
    recentDeliveries: 2600,
    volunteerHours: 120,
    topNeeds: ["Size 3 diapers", "Pull-ups", "Reusable swim diapers"],
    partners: [
      "Brookline Parent Collective",
      "Family Access of Newton",
      "Temple Israel Social Action",
    ],
    upcomingEvents: [
      "Mar 9 – Volunteer driver onboarding at Brookline Town Hall",
      "Apr 3 – Family wellness night with stroller safety checks",
    ],
  },
  somerville: {
    narrative:
      "Somerville pop-ups now include evening pickups, letting shift workers collect diapers alongside CSA shares and resource referrals.",
    recentDeliveries: 3600,
    volunteerHours: 140,
    topNeeds: ["Size 5 diapers", "Toddler wipes", "Baby shampoo"],
    partners: [
      "Somerville Neighborhood Initiative",
      "Welcome Project Family Table",
      "Groundwork Somerville",
    ],
    upcomingEvents: [
      "Mar 15 – Evening distribution at St. Anthony Hall",
      "Apr 6 – Diaper kit assembly with local tech volunteers",
    ],
  },
  dorchester: {
    narrative:
      "Dorchester partners anchor weekly distributions at churches and Boston Housing sites, pairing diaper access with health screenings.",
    recentDeliveries: 5100,
    volunteerHours: 210,
    topNeeds: ["Size 6 diapers", "Newborn bundles", "Baby wipes"],
    partners: [
      "Dorchester Family Pantry",
      "Codman Square Health Collaborative",
      "Project RIGHT Inc.",
    ],
    upcomingEvents: [
      "Mar 19 – Neighborhood resource fair at Codman Academy",
      "Apr 9 – Baby transport safety workshop",
    ],
  },
};

export const impactAssumptions = {
  diaperCost: 0.27, // average cost per diaper in USD
  distributionEfficiency: 0.92, // % of donation that goes directly to supplies & delivery
  diapersPerChildPerWeek: 50, // typical usage per child
};
