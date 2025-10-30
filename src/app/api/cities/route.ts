/**
 * GET /api/cities
 *
 * Returns a single city's record (matched by name) so the frontend has a well-documented
 * place to pull geographic context.
 *
 * Query params:
 *   - name: required; case-insensitive lookup for the city name.
 *   - year: optional; filters related distributions by the supplied year.
 *   - month: optional; filters related distributions by the supplied month (in combination with year).
 *
 * We keep the handler dead simple: query through Prisma, include per-city distribution
 * records, and ship the results back to the caller. Whenever you add another table,
 * feel free to clone this file as your starter template.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma as PrismaTypes } from "@/generated/prisma/client";
import { stringifyWithBigInt } from "@/lib/util";

export const dynamic = "force-dynamic"; // ensure Next.js never caches DB reads.

type Filters = {
  name: string;
  year?: string;
  month?: string;
};

const jsonResponse = (value: unknown, init?: ResponseInit) =>
  new NextResponse(stringifyWithBigInt(value), {
    headers: { "content-type": "application/json" },
    ...init,
  });

// Pull the query params up-front so downstream helpers stay focused.
const parseFilters = (request: Request): Filters | null => {
  const { searchParams } = new URL(request.url);

  const name = searchParams.get("name");
  const year = searchParams.get("year") ?? undefined;
  const month = searchParams.get("month") ?? undefined;

  if (!name) {
    return null;
  }

  return { name, year, month };
};

const baseCityInclude = {
  distributions: {
    include: {
      partner: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }] as const,
  },
} satisfies PrismaTypes.CityInclude;

type CityWithDistributions = PrismaTypes.CityGetPayload<{
  include: typeof baseCityInclude;
}>;
type DistributionWithPartner = CityWithDistributions["distributions"][number];
type FormattedDistribution = ReturnType<typeof formatDistribution>;
type PartnerSummary = NonNullable<FormattedDistribution["partner"]>;

const buildCityWhere = ({ name }: Filters): PrismaTypes.CityWhereInput => ({
  name: {
    equals: name,
    mode: "insensitive",
  },
});

const buildCityInclude = ({ year, month }: Filters) =>
  ({
    distributions: {
      ...baseCityInclude.distributions,
      where: {
        ...(year ? { year } : {}),
        ...(month ? { month } : {}),
      },
    },
  }) satisfies PrismaTypes.CityInclude;

// Ensure numbers/bools stay predictable for the frontend.
const formatDistribution = (distribution: DistributionWithPartner) => ({
  id: Number(distribution.id),
  year: distribution.year ?? null,
  month: distribution.month ?? null,
  numberDiapers: distribution.numberDiapers ?? null,
  numberChildren: distribution.numberChildren ?? null,
  percentage: distribution.percentage ?? null,
  partner: distribution.partner
    ? {
        id: Number(distribution.partner.id),
        name: distribution.partner.name ?? null,
      }
    : null,
});

// Deduplicate partner records so consumers can render a flat list.
const collectPartners = (
  distributions: FormattedDistribution[]
): PartnerSummary[] =>
  Array.from(
    distributions
      .reduce((acc, distribution) => {
        if (distribution.partner) {
          acc.set(distribution.partner.id, distribution.partner);
        }
        return acc;
      }, new Map<number, PartnerSummary>())
      .values()
  );

export async function GET(request: Request) {
  const filters = parseFilters(request);

  if (!filters) {
    return jsonResponse(
      { error: "Query parameter `name` is required." },
      { status: 400 }
    );
  }

  const where = buildCityWhere(filters);
  const include = buildCityInclude(filters);

  const cityQuery = {
    where,
    orderBy: { name: "asc" } as const,
    include,
  } satisfies PrismaTypes.CityFindFirstArgs;

  try {
    const city = await prisma.city.findFirst(cityQuery);

    if (!city) {
      return jsonResponse({ data: null });
    }

    const distributions = city.distributions.map(formatDistribution);
    const partners = collectPartners(distributions);

    const data = {
      id: Number(city.id),
      name: city.name ?? null,
      distributions,
      partners,
    };

    return jsonResponse({ data });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load cities from the database.";

    return jsonResponse({ error: message }, { status: 500 });
  }
}
