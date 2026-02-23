/**
 * Stringifies a value to JSON, converting any BigInt values to strings to avoid serialization errors.  Use this function whenever you need to serialize data that may contain BigInt fields, such as Prisma query results.
 * @param value - The value to stringify, which can be of any type. This can be an object, array, primitive, etc. Most commonly used for objects containing BigInt fields, like the Prisma query results.
 * @returns The JSON string representation of the value, with BigInts converted to strings.
 */
import Papa from "papaparse";
// import { MonthlyData } from "@/generated/prisma/client";

export function stringifyWithBigInt(value: unknown) {
  return JSON.stringify(value, (_key, jsonValue) =>
    typeof jsonValue === "bigint" ? jsonValue.toString() : jsonValue,
  );
}

export type PercentageData = {
  data: PercentageDataElem[];
}

export type PercentageDataElem = {
  city: {
      id: BigInt;
      name: string;
    };
    percentage: number;
    cityId: BigInt;
    partnerId: BigInt;
}

export type CityData = {
  city: string;
  percentage: number;
  diapers: number;
  children_helped: number;
};

export type DistributionData = {
  partner_name: string;
  diapers_distributed: number;
  children_helped: number;
  cities: CityData[];
};

async function getCitiesAndPercentages(partnerName: string) {
  fetch("/api/partners/percentages?partnerName=" + partnerName).then((response) => response.json()).then((data: PercentageData) =>
  {
    return data;
  })

  return undefined;
}

export async function parseDistributionData(csv: string): Promise<DistributionData[]> {
  const data = Papa.parse(csv);
  const result: DistributionData[] = [];
  // const monthlyData: MonthlyData[] = [];

  /* 
  (alias) type MonthlyData = {
    partnerId: bigint;
    year: string;
    month: month;
    numDiapers: bigint | null;
    numBabies: bigint | null;
    id: string;
  } 
  */

  for (let i = 1; i < data.data.length; i++) {
    let row = data.data[i] as string[];
    
    if (row && row[0]) {
      fetch("/api/partners/percentages?partnerName=" + row[0]).then((response) => response.json()).then((data: PercentageData) =>
      {
        if (row[2]) {
          const totalDiapers = Number(row[2].replace(",", ""));
          const totalChildren = Number(row[1].replace(",", ""));

          let cityData: CityData[] = [];

          for (let i in data.data) {
            cityData.push({
              city: data.data[i].city.name,
              percentage: data.data[i].percentage,
              diapers: Math.floor(data.data[i].percentage * Number(row[2].replace(",", ""))),
              children_helped: Math.floor(data.data[i].percentage * Number(row[1].replace(",", ""))),
            });
          }

          result.push({
            partner_name: row[0],
            diapers_distributed: totalDiapers,
            children_helped: totalChildren,
            cities: cityData
          })
        }
      });
    }
  }
  
  return result;
}
