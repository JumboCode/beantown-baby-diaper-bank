"use client";

import { Table } from "@mantine/core";
import { Distribution } from "@/lib/types";

export default function DistributionsTable({
  distributionData,
}: {
  distributionData: Distribution[];
}) {
  const rows = distributionData.map((dist) => (
    <Table.Tr key={`${dist.id}`}>
      <Table.Td fz={16} fw={600} c="#101828" className="text-sm text-gray-600">
        {dist.partner?.name}
      </Table.Td>
      <Table.Td className="text-sm text-gray-600">{dist.city?.name}</Table.Td>
      <Table.Td className="text-sm text-gray-600">
        {dist.numberDiapers}
      </Table.Td>
      <Table.Td className="text-sm text-gray-600">
        {dist.numberChildren}
      </Table.Td>
      <Table.Td className="text-sm text-gray-600">{dist.month}</Table.Td>
      <Table.Td className="text-sm text-gray-600">{dist.year}</Table.Td>
      <Table.Td className="text-sm text-gray-600">
        {dist.percentage ? (dist.percentage * 100).toFixed(2) : "0.00"}%
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
