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
  Button,
} from "@mantine/core";
import Image from "next/image";
import { Poppins } from "next/font/google";
import AddNewAdminForm from "@/components/admin/AddNewAdminForm";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

interface Admin {
  id: string;
  name: string;
  email: string;
  level: string;
  isAdmin: boolean;
}

export default function AdminControlsPage() {
  const router = useRouter();

  const [adminList, setAdminList] = useState<Admin[]>([]);

  const [error, setError] = useState<string | null>(null);

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admin/list");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch admins");
      }

      setAdminList(data.admins);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleDelete = async (adminId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this admin? This action cannot be undone.");

    if (!confirmed) return;

    try {
      const response = await fetch("/api/admin/add", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: adminId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete admin");
      }

      setAdminList((prevAdmins) => prevAdmins.filter((admin) => admin.id !== adminId));
      
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred while trying to delete the admin.");
    }
  };

  if (error) {
    return (
      <Container size="xl" py="xl" className={poppins.className}>
        <Alert color="red">{error}</Alert>
      </Container>
    );
  }

  const rows = adminList.map((element, index) => (
    <Table.Tr key={`${element.email}-${index}`}>
      <Table.Td>{element.name}</Table.Td>
      <Table.Td>{element.email}</Table.Td>
      <Table.Td>{element.level}</Table.Td>
      <Table.Td>
        {/* Delete button with requested SVG */}
        <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(element.id)}>
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
          <Group gap="sm">
            <Button variant="subtle" onClick={() => router.back()}>
              Back
            </Button>
            <Title order={2} fw={700}>
            Manage Admin
            </Title>
          </Group>
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
