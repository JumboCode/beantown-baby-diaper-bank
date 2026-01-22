/**
 * Stringifies a value to JSON, converting any BigInt values to strings to avoid serialization errors.  Use this function whenever you need to serialize data that may contain BigInt fields, such as Prisma query results.
 * @param value - The value to stringify, which can be of any type. This can be an object, array, primitive, etc. Most commonly used for objects containing BigInt fields, like the Prisma query results.
 * @returns The JSON string representation of the value, with BigInts converted to strings.
 */
import Papa from "papaparse";

export function stringifyWithBigInt(value: unknown) {
  return JSON.stringify(value, (_key, jsonValue) =>
    typeof jsonValue === "bigint" ? jsonValue.toString() : jsonValue
  );
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

export function parseDistributionData(csv: string) {
  const data = Papa.parse(csv);
  const result: DistributionData[] = [];

  let i = 1;
  while (i < data.data.length) {
    let row = data.data[i] as string[];

    let provider: DistributionData = {
      partner_name: "",
      diapers_distributed: 0,
      children_helped: 0,
      cities: [],
    };

    if (row[0] != "") {
      // name exists
      const total_diapers_distributed = Number(row[2].replace(",", ""));
      const total_children_helped = Number(row[1].replace(",", ""));

      provider = {
        partner_name: row[0],
        diapers_distributed: Number(row[2].replace(",", "")),
        children_helped: Number(row[1].replace(",", "")),
        cities: [
          {
            city: row[3],
            percentage: Number(row[4].replace("%", "")) / 100,
            diapers:
              (Number(row[4].replace("%", "")) / 100) *
              total_diapers_distributed,
            children_helped:
              (Number(row[4].replace("%", "")) / 100) * total_children_helped,
          },
        ],
      };

      let j = i + 1;
      row = data.data[j] as string[];
      while (row[0] == "" && j < data.data.length - 1) {
        provider.cities.push({
          city: row[3],
          percentage: Number(row[4].replace("%", "")) / 100,
          diapers:
            (Number(row[4].replace("%", "")) / 100) * total_diapers_distributed,
          children_helped:
            (Number(row[4].replace("%", "")) / 100) * total_children_helped,
        });

        j++;
        row = data.data[j] as string[];
      }

      result.push(provider);
    }

    i++;
    row = data.data[i] as string[];
  }

  // console.log(result);
  return result;
}

