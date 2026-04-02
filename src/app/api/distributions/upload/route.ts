import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePartnerRows, processDistributionUpload } from "@/lib/server/distribution-upload";
import { revalidateTag } from "next/cache";
import { month } from "@/generated/prisma/client";

type UploadRequestBody = {
  csv: string;
  selectedDate: string;
};

type PartnerApiItem = {
  name: string | null;
  status: "active" | "inactive" | "waitlisted";
};

type TimelineMonthItem = {
  Month: month;
  Year: string | null;
};

const MONTH_NAMES = Object.values(month) as month[];

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}
// Todo: remove num babies column from upload
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UploadRequestBody;

    if (!body?.csv || !body?.selectedDate) {
      return NextResponse.json({ error: "csv and selectedDate are required." }, { status: 400 });
    }

    const parsedDate = new Date(body.selectedDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid selectedDate provided." }, { status: 400 });
    }

    const { parsed: partnerRows } = parsePartnerRows(body.csv);
    const csvPartnerNamesByNormalized = new Map<string, string>();
    for (const row of partnerRows) {
      csvPartnerNamesByNormalized.set(normalizeName(row.partnerName), row.partnerName);
    }

    const [partners, distributions] = await Promise.all([
      prisma.partner.findMany({
        select: {
          name: true,
          status: true,
        },
      }),
      prisma.distribution.findMany({
        distinct: ["year", "month"],
        select: {
          month: true,
          year: true,
        },
      }),
    ]);

    const timelinePayload = {
      months: distributions.map((distribution) => ({
        Month: distribution.month,
        Year: distribution.year,
      })) as TimelineMonthItem[],
    };

    const partnerByNormalizedName = new Map(
      partners
        .filter((partner) => partner.name)
        .map((partner) => [normalizeName(partner.name as string), partner as PartnerApiItem]),
    );

    const errors = new Set<string>();

    const seen = new Set<string>();

    for (const row of partnerRows) {
      const name = row.partnerName?.trim();
      const totalDiapersStr = String(row.totalDiapers ?? "")
        .replace(/,/g, "")
        .trim();

      // Check for missing fields
      if (!name || totalDiapersStr === "") {
        errors.add("There are missing fields in the spreadsheet. Please fix and reupload.");
        if (!name) continue;
      }

      // Check for invalid characters
      const isInvalidDiapers = totalDiapersStr !== "" && !/^\d+$/.test(totalDiapersStr);

      if (isInvalidDiapers) {
        errors.add(
          "There are non-numeric or negative values for number of diapers in the spreadsheet. Please fix and reupload.",
        );
      }

      const displayName = row.partnerName;
      const normalizedName = normalizeName(displayName);

      // Check for duplicates organizations
      if (seen.has(normalizedName)) {
        errors.add(
          `Organization ${displayName} appears multiple times in the spreadsheet. Please fix duplicates.`,
        );
        continue;
      }

      seen.add(normalizedName);

      // Check if partner does not exist
      const partner = partnerByNormalizedName.get(normalizedName);

      if (!partner) {
        errors.add(
          `Organization ${displayName} does not exist, consider adding them as a new Partner`,
        );
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

    const targetMonth = MONTH_NAMES[parsedDate.getUTCMonth()];
    const targetYear = String(parsedDate.getUTCFullYear());
    const monthExists = (timelinePayload.months ?? []).some(
      (monthItem) => monthItem.Month === targetMonth && monthItem.Year === targetYear,
    );

    if (monthExists) {
      errors.add(`Data for ${targetMonth} has previously been uploaded`);
    }

    const errorList = Array.from(errors);
    if (errorList.length > 0) {
      return NextResponse.json(
        {
          error: errorList[0],
          errors: errorList,
        },
        { status: 400 },
      );
    }

    const result = await processDistributionUpload({
      csv: body.csv,
      selectedDate: body.selectedDate,
    });

    revalidateTag("cities", "max");

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process uploaded distribution data.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
