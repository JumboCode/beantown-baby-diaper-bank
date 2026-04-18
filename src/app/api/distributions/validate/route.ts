import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePartnerRows } from "@/lib/server/distribution-upload";

type ValidateRequestBody = {
  csv: string;
};

type PartnerApiItem = {
  name: string | null;
  status: "active" | "inactive" | "waitlisted";
};

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ValidateRequestBody;

    if (!body?.csv) {
      return NextResponse.json({ error: "csv is required." }, { status: 400 });
    }

    const { parsed: partnerRows } = parsePartnerRows(body.csv);

    const partners = await prisma.partner.findMany({
      select: {
        name: true,
        status: true,
      },
    });

    const partnerByNormalizedName = new Map(
      partners
        .filter((partner) => partner.name)
        .map((partner) => [normalizeName(partner.name as string), partner as PartnerApiItem]),
    );

    const errors = new Set<string>();
    const seen = new Set<string>();

    for (const row of partnerRows) {
      const name = row.partnerName?.trim();
      const totalDiapersStr = String(row.totalDiapers ?? "").replace(/,/g, "").trim();

      // Check for missing fields
      if (!name || totalDiapersStr === "") {
        errors.add("There are missing fields in the spreadsheet. Please fix and reupload.");
        if (!name) continue;
      }

      // Check for invalid characters
      const isInvalidDiapers = totalDiapersStr !== "" && !/^\d+$/.test(totalDiapersStr);

      if (isInvalidDiapers) {
        errors.add("There are non-numeric or negative values for number of diapers in the spreadsheet. Please fix and reupload.");
      }

      const displayName = row.partnerName;
      const normalizedName = normalizeName(displayName);

      // Check for duplicates organizations
      if (seen.has(normalizedName)) {
        errors.add(`Organization ${displayName} appears multiple times in the spreadsheet. Please fix duplicates.`);
        continue;
      }
      seen.add(normalizedName);

      // Check if partner does not exist
      const partner = partnerByNormalizedName.get(normalizedName);
      if (!partner) {
        errors.add(`Organization ${displayName} does not exist, consider adding them as a new Partner`);
        continue;
      }

      // Check status of partners
      if (partner.status === "inactive") {
        errors.add(`Organization ${displayName} is inactive. Consider editing its status.`);
      }

      if (partner.status === "waitlisted") {
        errors.add(`Organization ${displayName} is waitlisted. Consider editing its status.`);
      }
    }

    const errorList = Array.from(errors);
    
    return NextResponse.json(
      {
        valid: errorList.length === 0,
        errors: errorList,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to validate uploaded distribution data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
