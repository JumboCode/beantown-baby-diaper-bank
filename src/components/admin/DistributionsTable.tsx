"use client";

import { useMemo } from "react";
import { Table, Text } from "@mantine/core";
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

        const diapers = dist.numberDiapers ? parseInt(dist.numberDiapers, 10) : 0;
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


  const rows: React.ReactNode[] = totals.map((date) => {
    const partnerGroups = date.distributions.reduce<
      Record<string, { partnerName: string; totalDiapers: number }>
    >((acc, dist) => {
      const partnerName = dist.partner?.name?.trim() || "Unknown Partner";
      const diapers = dist.numberDiapers ? parseInt(dist.numberDiapers, 10) : 0;

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
      <Table.Tr key={`${date.year}-${date.month}`}>
        <Table.Td fz={24} fw={600} c="#101828" className="text-sm text-gray-600">
          <div className="mb-3">
            {date.month} {date.year}, {date.total} diapers
          </div>

          <div className="space-y-2">
            {partnerEntries.map((partner) => (
              <CollapsibleDropdown<Distribution[]>
                key={`${date.year}-${date.month}-${partner.partnerName}`}
                title={`${partner.partnerName} ${partner.totalDiapers}`}
                endpoint={`/api/distributions?month=${date.month}&year=${date.year}`}
                render={(data) => {
                  const rowsForPartner = data
                    .filter(
                      (dist) =>
                        dist.month === date.month &&
                        dist.year === date.year &&
                        (dist.partner?.name?.trim() || "Unknown Partner") ===
                          partner.partnerName,
                    )
                    .sort((a, b) =>
                      (a.city?.name ?? "").localeCompare(b.city?.name ?? ""),
                    );

                  if (rowsForPartner.length === 0) {
                    return <div className="text-sm text-gray-600">No distributions found.</div>;
                  }

                  return (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <div className="grid grid-cols-6 gap-4 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                        <div>Partner</div>
                        <div>City</div>
                        <div>Diapers</div>
                        <div>Children</div>
                        <div>Month</div>
                        <div>Year</div>
                      </div>
                      {rowsForPartner.map((dist) => (
                        <div
                          key={dist.id}
                          className="grid grid-cols-6 gap-4 border-b border-gray-100 px-4 py-3 text-sm text-gray-700 last:border-b-0"
                        >
                          <div className="font-semibold text-gray-900">
                            {dist.partner?.name ?? "Unknown Partner"}
                          </div>
                          <div>{dist.city?.name ?? "-"}</div>
                          <div>{dist.numberDiapers ?? "0"}</div>
                          <div>{dist.numberChildren ?? "0"}</div>
                          <div>{dist.month ?? "-"}</div>
                          <div>{dist.year ?? "-"}</div>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
            ))}
          </div>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
      <div className="overflow-x-auto flex-1">
        <Table
          highlightOnHover
          withTableBorder
          styles={{ th: { color: "#667085" } }}
          tabularNums
        >
          {/* <Table.Thead style={{ backgroundColor: "#F9FAFB" }}>
            <Table.Tr>
              <Table.Th fw="normal" fz="14px">
                Partner Name
              </Table.Th>
              <Table.Th fw="normal" fz="14px">
                City
              </Table.Th>
              <Table.Th fw="normal" fz="14px">
                Number of Diapers Distributed
              </Table.Th>
              <Table.Th fw="normal" fz="14px">
                Number of Children Helped
              </Table.Th>
              <Table.Th fw="normal" fz="14px">
                Month
              </Table.Th>
              <Table.Th fw="normal" fz="14px">
                Year
              </Table.Th>
              <Table.Th fw="normal" fz="14px">
                Percentage
              </Table.Th>
            </Table.Tr>
          </Table.Thead> */}
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </div>
    </div>
  );
}
