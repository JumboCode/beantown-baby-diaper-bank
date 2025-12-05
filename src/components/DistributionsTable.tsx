"use client";

import { useEffect, useState } from "react";
import { Table, Text, ActionIcon } from "@mantine/core";
import Image from "next/image";

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

  if (error) return <Text c="red">Error: {error}</Text>;

  // Group by organization
  const grouped = distributions.reduce(
    (acc, dist) => {
      const orgName = dist.partner.name;
      if (!acc[orgName]) {
        acc[orgName] = [];
      }
      acc[orgName].push(dist);
      return acc;
    },
    {} as Record<string, Distribution[]>
  );

  const rows: React.ReactNode[] = [];

  //group by org
  Object.entries(grouped).forEach(([orgName, dists]) => {
    dists.forEach((dist, idx) =>
      rows.push(
        <Table.Tr key={`${orgName}-${dist.id}`}>
          {idx === 0 && (
            <Table.Td
              fz={"lg"}
              rowSpan={dists.length}
              p={"xl"}
              style={{ verticalAlign: "middle", fontWeight: "bold" }}>
              {orgName}
            </Table.Td>
          )}
          <Table.Td>{dist.city.name}</Table.Td>
          <Table.Td>{dist.numberDiapers}</Table.Td>
          <Table.Td>{dist.numberChildren}</Table.Td>
          <Table.Td>{dist.month}</Table.Td>
          <Table.Td>{dist.year}</Table.Td>
          <Table.Td>{(dist.percentage * 100).toFixed(2)}%</Table.Td>
        </Table.Tr>
      )
    );
  });

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
      <div className="overflow-x-auto flex-1">
        <Table
          highlightOnHover
          withTableBorder
          styles={{ th: { color: "#667085" } }}
          tabularNums>
          <Table.Thead style={{ backgroundColor: "#F9FAFB" }}>
            <Table.Tr>
              <Table.Th>Organization Name</Table.Th>
              <Table.Th>City</Table.Th>
              <Table.Th>Number of Diapers Distributed</Table.Th>
              <Table.Th>Number of Children Helped</Table.Th>
              <Table.Th>Month</Table.Th>
              <Table.Th>Year</Table.Th>
              <Table.Th>Percentage</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </div>
    </div>
  );
}
