import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parsePartnerRows,
  processDistributionUpload,
} from "@/lib/server/distribution-upload";
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
      
      // TODO
      // errors.add(`Data for ${targetMonth} has previously been uploaded`);
      // find existing distributions for that month/year, send their ids to delete_old
      const existing = await prisma.distribution.findMany({
        where: { month: targetMonth, year: targetYear },
        select: { id: true },
      });

      if (existing.length >= 0) {
        const ids = existing.map((d) => d.id.toString());

        const deleteReq = new Request("http://internal/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });

        const deleteResp = await delete_old(deleteReq);

        // propagate any failure from the delete handler
        if (deleteResp && (deleteResp as any).status !== 200) {
          return deleteResp;
        }
      }

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
      error instanceof Error
        ? error.message
        : "Failed to process uploaded distribution data.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}


export async function delete_old(req: Request) {
  try {
    const body = await req.json();
    const ids = (body?.ids ?? []) as string[];

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No ids provided" }, { status: 400 });
    }

    const parsedIds = ids.map((id) => BigInt(id));

    const toDelete = await prisma.distribution.findMany({
      where: { id: { in: parsedIds } },
      select: {
        partnerId: true,
        cityId: true,
        year: true,
        month: true,
        numberDiapers: true,
        numberChildren: true,
      },
    });

    const monthlyDataKeys = [
      ...new Map(
        toDelete
          .filter((d) => d.partnerId && d.year && d.month)
          .map((d) => [`${d.partnerId}-${d.year}-${d.month}`, d]),
      ).values(),
    ] as { partnerId: bigint; year: string; month: string }[];

    const yearlyTotals = new Map<
      string,
      { cityId: bigint; year: string; diapers: bigint; children: bigint }
    >();
    for (const d of toDelete) {
      if (!d.cityId || !d.year) continue;
      const key = `${d.cityId}-${d.year}`;
      const existing = yearlyTotals.get(key) ?? {
        cityId: d.cityId,
        year: d.year,
        diapers: BigInt(0),
        children: BigInt(0),
      };
      existing.diapers += d.numberDiapers ?? BigInt(0);
      existing.children += d.numberChildren ?? BigInt(0);
      yearlyTotals.set(key, existing);
    }

    const [result] = await prisma.$transaction([
      prisma.distribution.deleteMany({
        where: { id: { in: parsedIds } },
      }),
      ...monthlyDataKeys.map(({ partnerId, year, month }) =>
        prisma.monthlyData.deleteMany({
          where: { partnerId, year, month: month as never },
        }),
      ),
      ...[...yearlyTotals.values()].map(({ cityId, year, diapers, children }) =>
        prisma.yearlyData.updateMany({
          where: { cityId, year },
          data: {
            numDiapers: { decrement: diapers },
            numBabies: { decrement: children },
          },
        }),
      ),
    ]);

    revalidateTag("cities", "max");

    return NextResponse.json({ deletedCount: result.count });
  } catch (error) {
    console.error("Error deleting distributions:", error);
    return NextResponse.json({ error: "Failed to delete distributions" }, { status: 500 });
  }
}
