"use client";

import { useMemo } from "react";
import { Text } from "@mantine/core";
import { Distribution } from "@/lib/types";
import { CollapsibleDropdown } from "./Dropdown";

const MONTH_ORDER: Record<string, number> = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

interface DateTotal {
  month: string;
  year: string;
  total: number;
  distributions: Distribution[];
}

export default function DistributionsTable({
  distributionData,
}: {
  distributionData: Distribution[];
}) {
  const error: string | undefined = undefined;

  const totals: DateTotal[] = useMemo(() => {
    const grouped = distributionData.reduce<Record<string, DateTotal>>(
      (acc, dist) => {
        if (!dist.month || !dist.year) return acc;

        const key = `${dist.year}-${dist.month}`;

        if (!acc[key]) {
          acc[key] = {
            month: dist.month,
            year: dist.year,
            total: 0,
            distributions: [],
          };
        }

        const diapers = dist.numberDiapers
          ? parseInt(dist.numberDiapers, 10)
          : 0;
        acc[key].total += diapers;
        acc[key].distributions.push(dist);

        return acc;
      },
      {},
    );

    const groupedArray = Object.values(grouped).map((group) => ({
      ...group,
      distributions: group.distributions.sort((a, b) => {
        const nameA = a.partner?.name ?? "";
        const nameB = b.partner?.name ?? "";
        return nameA.localeCompare(nameB);
      }),
    }));

    return groupedArray.sort((a, b) => {
      if (a.year !== b.year) return Number(b.year) - Number(a.year);
      return (MONTH_ORDER[a.month] ?? 99) - (MONTH_ORDER[b.month] ?? 99);
    });
  }, [distributionData]);

  if (error) return <Text c="red">Error: {error}</Text>;

  return (
    <div className="space-y-2">
      {totals.map((date) => (
        <CollapsibleDropdown<Distribution[]>
          key={`${date.year}-${date.month}`}
          title={
            <span className="flex items-center gap-3">
              <span>{`${date.month} ${date.year}`}</span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[#053766]">
                {date.total.toLocaleString()} diapers
              </span>
            </span>
          }
          titleClassName="text-[22px] font-bold"
          endpoint={`/api/distributions?month=${date.month}&year=${date.year}`}
          render={(monthData) => {
            const rowsForMonth = monthData
              .filter(
                (dist) => dist.month === date.month && dist.year === date.year,
              )
              .sort((a, b) =>
                (a.partner?.name ?? "").localeCompare(b.partner?.name ?? ""),
              );

            const partnerGroups = rowsForMonth.reduce<
              Record<string, { partnerName: string; totalDiapers: number }>
            >((acc, dist) => {
              const partnerName =
                dist.partner?.name?.trim() || "Unknown Partner";
              const diapers = dist.numberDiapers
                ? parseInt(dist.numberDiapers, 10)
                : 0;

              if (!acc[partnerName]) {
                acc[partnerName] = {
                  partnerName,
                  totalDiapers: 0,
                };
              }

              acc[partnerName].totalDiapers += diapers;
              return acc;
            }, {});

            const partnerEntries = Object.values(partnerGroups).sort((a, b) =>
              a.partnerName.localeCompare(b.partnerName),
            );

            return (
              <div className="space-y-2">
                {partnerEntries.map((partner) => (
                  <CollapsibleDropdown<Distribution[]>
                    key={`${date.year}-${date.month}-${partner.partnerName}`}
                    title={partner.partnerName}
                    right={
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#053766]">
                          {partner.totalDiapers.toLocaleString()} diapers
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log(
                              "Edit",
                              partner.partnerName,
                              date.month,
                              date.year,
                            );
                          }}
                          className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                      </div>
                    }
                    endpoint={`/api/distributions?month=${date.month}&year=${date.year}`}
                    render={(data) => {
                      const rowsForPartner = data
                        .filter(
                          (dist) =>
                            dist.month === date.month &&
                            dist.year === date.year &&
                            (dist.partner?.name?.trim() ||
                              "Unknown Partner") === partner.partnerName,
                        )
                        .sort((a, b) =>
                          (a.city?.name ?? "").localeCompare(
                            b.city?.name ?? "",
                          ),
                        );

                      if (rowsForPartner.length === 0) {
                        return (
                          <div className="text-sm text-gray-600">
                            No distributions found.
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <div className="grid grid-cols-2 gap-4 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#053766]">
                            <div>City</div>
                            <div>Diapers</div>
                          </div>
                          {rowsForPartner.map((dist) => (
                            <div
                              key={dist.id}
                              className="grid grid-cols-2 gap-4 border-b border-gray-100 px-4 py-3 text-sm text-gray-700 last:border-b-0"
                            >
                              <div>{dist.city?.name ?? "-"}</div>
                              <div>{dist.numberDiapers ?? "0"}</div>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                ))}
              </div>
            );
          }}
        />
      ))}
    </div>
  );
}
