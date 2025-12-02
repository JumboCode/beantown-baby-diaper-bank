// types/parse-address.d.ts (or similar)
declare module "parse-address" {
  export interface ParsedLocation {
    number?: string;
    prefix?: string;
    street?: string;
    type?: string;
    suffix?: string;
    sec_unit_type?: string;
    sec_unit_num?: string;
    city?: string;
    state?: string;
    zip?: string;
  }

  export function parseLocation(input: string): ParsedLocation;
  export function parseAddress(input: string): ParsedLocation; // alias
}
