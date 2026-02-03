"use client";

import { useEffect, useState } from "react";
import { Table, Text } from "@mantine/core";
interface Distribution {
  id: string;
  createdAt: string;
  partnerId: string;
  cityId: string;
  year: string;
  month: string;
  numberDiapers: string;
  numberChildren: string;
  percentage: number;
  partner: {
    name: string;
  };
  city: {
    name: string;
  };
}

export default function DistributionsTable() {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const fetchDistributions = async () => {
      try {
        const response = await fetch("/api/distributions");
        if (!response.ok) throw new Error("Failed to fetch distributions");
        const data = await response.json();
        // Handle both array and object responses
        const distributions = Array.isArray(data)
          ? data
          : data.distributions || [];
        setDistributions(distributions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    };

    fetchDistributions();
  }, []);

  
  const dates: Array<{month: string, year: string}> = distributions.map((dist) =>({
    month: dist.month,
    year: dist.year
  })).filter(
    (d, index, self) =>
    index === self.findIndex(
      x => x.month === d.month && x.year === d.year
    )
  );

  console.log(dates)

  if (error) return <Text c="red">Error: {error}</Text>;

  const rows: React.ReactNode[] = distributions.map((dist) => (
    <Table.Tr key={`${dist.id}`}> 

      <Table.Td fz={16} fw={600} c="#101828" className="text-sm text-gray-600">
        {dist.partner.name}
      </Table.Td>
      <Table.Td className="text-sm text-gray-600">{dist.city.name}</Table.Td>
      <Table.Td className="text-sm text-gray-600">
        {dist.numberDiapers}
      </Table.Td>
      <Table.Td className="text-sm text-gray-600">
        {dist.numberChildren}
      </Table.Td>
      <Table.Td className="text-sm text-gray-600">{dist.month}</Table.Td>
      <Table.Td className="text-sm text-gray-600">{dist.year}</Table.Td>
      <Table.Td className="text-sm text-gray-600">
        {(dist.percentage * 100).toFixed(2)}%
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
      <div className="overflow-x-auto flex-1">
        <Table
          highlightOnHover
          withTableBorder
          styles={{ th: { color: "#667085" } }}
          tabularNums
        >
          <Table.Thead style={{ backgroundColor: "#F9FAFB" }}>
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
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </div>
    </div>
  );
}
