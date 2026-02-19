"use client";

import { useEffect, useMemo, useState } from "react";
import { Table, Text } from "@mantine/core";
import { Distribution } from "@/lib/types";
import { CollapsibleDropdown } from "./Dropdown";


interface dateTotal {
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
  const [error, setError] = useState<string>();

  const possibleDates: Array<{ month: string | null; year: string | null }> =
    useMemo(() => {
      return distributionData
        .map((dist) => ({
          month: dist.month,
          year: dist.year,
        }))
        .filter(
          (d, index, self) =>
            index ===
            self.findIndex((x) => x.month === d.month && x.year === d.year),
        );
    }, [distributionData]);

const totals: dateTotal[] = useMemo(() => {
  const grouped = distributionData.reduce<Record<string, dateTotal>>(
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
        ? parseInt(dist.numberDiapers)
        : 0;

      acc[key].total += diapers;
      acc[key].distributions.push(dist);

      return acc;
    },
    {}
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
    return a.month.localeCompare(b.month);
  });
}, [distributionData]);


  console.log(totals);

  if (error) return <Text c="red">Error: {error}</Text>;

 

  const rows: React.ReactNode[] = totals.flatMap((date) => {
    const mainRow = (
        <Table.Tr key={`${date.year}-${date.month}`}>
        <Table.Td
          fz={24}
          fw={600}
          c="#101828"
          className="text-sm text-gray-600"
        >
        
        {/* 1:17 2/19/26 CHANGED */}
          <CollapsibleDropdown
          title={`${date.month} ${date.year}, ${date.total} diapers`}
          endpoint={`/api/distributions?month=${date.month}&year=${date.year}`}
          render={(data) => (
            <div className="space-y-2">
              {/* TODO: render your rows from `data` here */}
              <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        />
          {date.month} {date.year}, {date.total} diapers
        </Table.Td>
      </Table.Tr>
    );

    const distRows = date.distributions
      .filter(
        ( d,
        ): d is Distribution & {
          partner: NonNullable<Distribution["partner"]>;
          city: NonNullable<Distribution["city"]>;
        } => d.partner !== null && d.city !== null,
      )
      .map((dist) => (
        <Table.Tr key={`${dist.id}`}>
          <Table.Td
            fz={16}
            fw={600}
            c="#101828"
            className="text-sm text-gray-600"
          >
            {dist.partner.name}
          </Table.Td> 
          <Table.Td className="text-sm text-gray-600">
            {dist.city?.name}
          </Table.Td>
          <Table.Td className="text-sm text-gray-600">
            {dist.numberDiapers}
          </Table.Td>
          <Table.Td className="text-sm text-gray-600">
            {dist.numberChildren}
          </Table.Td>
          <Table.Td className="text-sm text-gray-600">{dist.month}</Table.Td>
          <Table.Td className="text-sm text-gray-600">{dist.year}</Table.Td>
        </Table.Tr>
      ));

    return [mainRow, ...distRows];
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
