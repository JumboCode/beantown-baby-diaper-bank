import { NextResponse } from "next/server";
import {
  parsePartnerRows,
  processDistributionUpload,
} from "@/lib/server/distribution-upload";

type UploadRequestBody = {
  csv: string;
  selectedDate: string;
};

type PartnerApiItem = {
  name: string | null;
  status: "active" | "inactive" | "waitlisted";
};

type TimelineMonthItem = {
  Month: string | null;
  Year: string | null;
};

const MONTH_NAMES = [
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

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UploadRequestBody;

    if (!body?.csv || !body?.selectedDate) {
      return NextResponse.json(
        { error: "csv and selectedDate are required." },
        { status: 400 },
      );
    }

    const parsedDate = new Date(body.selectedDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid selectedDate provided." },
        { status: 400 },
      );
    }

    const { parsed: partnerRows } = parsePartnerRows(body.csv);
    const csvPartnerNamesByNormalized = new Map<string, string>();
    for (const row of partnerRows) {
      csvPartnerNamesByNormalized.set(normalizeName(row.partnerName), row.partnerName);
    }

    // forward cookies and auth headers to ensure background checks have the same context as the upload request
    const origin = new URL(request.url).origin;
    const cookieHeader = request.headers.get("cookie") ?? "";
    const authHeader = request.headers.get("authorization") ?? "";

    const [partnersResponse, timelineResponse] = await Promise.all([
      fetch(`${origin}/api/partners`, {
        method: "GET",
        cache: "no-store",
        headers: {
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
          ...(authHeader ? { authorization: authHeader } : {}),
        },
      }),
      fetch(`${origin}/api/timeline-slider`, {
        method: "GET",
        cache: "no-store",
        headers: {
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
          ...(authHeader ? { authorization: authHeader } : {}),
        },
      }),
    ]);

    if (!partnersResponse.ok || !timelineResponse.ok) {
      const partnerFailure = !partnersResponse.ok
        ? `partners check failed (${partnersResponse.status})`
        : null;
      const timelineFailure = !timelineResponse.ok
        ? `timeline check failed (${timelineResponse.status})`
        : null;

      return NextResponse.json(
        {
          error: "Unable to run upload background checks.",
          errors: [partnerFailure, timelineFailure].filter(
            (value): value is string => value !== null,
          ),
        },
        { status: 502 },
      );
    }

    const partnersPayload = (await partnersResponse.json()) as {
      data?: PartnerApiItem[];
    };
    const timelinePayload = (await timelineResponse.json()) as {
      months?: TimelineMonthItem[];
    };

    const partnerByNormalizedName = new Map(
      (partnersPayload.data ?? [])
        .filter((partner) => partner.name)
        .map((partner) => [normalizeName(partner.name as string), partner]),
    );

    const errors = new Set<string>();

    for (const [normalizedName, displayName] of csvPartnerNamesByNormalized) {
      const partner = partnerByNormalizedName.get(normalizedName);
      if (!partner) {
        errors.add(
          `Organization ${displayName} does not exist, consider adding them as a new Partner`,
        );
        continue;
      }

      if (partner.status === "inactive") {
        errors.add(
          `Organization ${displayName} is inactive. Consider editing its status.`,
        );
      }

      if (partner.status === "waitlisted") {
        errors.add(
          `Organization ${displayName} is waitlisted. Consider editing its status.`,
        );
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

    console.log("Upload processed:", result);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to process uploaded distribution data.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
