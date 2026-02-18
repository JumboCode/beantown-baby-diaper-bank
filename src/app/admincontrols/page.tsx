"use client";

import {
  Table,
  Container,
  Title,
  Group,
  Paper,
  ActionIcon,
  Stack,
  Alert,
} from "@mantine/core";
import Image from "next/image";
import { Poppins } from "next/font/google";
import AddNewAdminForm from "@/components/admin/AddNewAdminForm";
import { useEffect, useState } from "react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AdminControlsPage() {
  const [adminData, setAdminData] = useState<
    {
      id: string;
      name: string;
      email: string;
      level: string;
      isAdmin: boolean;
    }[]
  >([]);

  const [error, setError] = useState<string | null>(null);

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admin/list");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch admins");
      }

      setAdminData(data.admins);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  if (error) {
    return (
      <Container size="xl" py="xl" className={poppins.className}>
        <Alert color="red">{error}</Alert>
      </Container>
    );
  }

  const rows = adminData.map((element, index) => (
    <Table.Tr key={`${element.email}-${index}`}>
      <Table.Td>{element.name}</Table.Td>
      <Table.Td>{element.email}</Table.Td>
      <Table.Td>{element.level}</Table.Td>
      <Table.Td>
        {/* Delete button with requested SVG */}
        <ActionIcon variant="subtle" color="red">
          <Image
            src="/admin_view/delete.svg"
            alt="delete icon"
            width={20}
            height={20}
          />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl" py="xl" className={poppins.className}>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2} fw={700}>
            Manage Admin
          </Title>
          <AddNewAdminForm onAdminAdded={fetchAdmins} />
        </Group>

        <Paper withBorder radius="md" p="md">
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Access Level</Table.Th>
                <Table.Th>Delete</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Paper>
      </Stack>
    </Container>
  );
}
