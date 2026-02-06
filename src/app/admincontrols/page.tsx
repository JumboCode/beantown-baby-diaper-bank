"use client";

import { 
  Table, 
  Container, 
  Title, 
  Group, 
  Button, 
  Paper, 
  ActionIcon,
  Stack,
  Text
} from "@mantine/core";
import Image from "next/image";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AdminControlsPage() {
  // Hard-coded data as requested
  const adminData = [
    { name: "Aoife DeClercq", email: "aoife.declercq@tufts.edu", level: "Super Admin" },
    { name: "Maggie Soran", email: "margaret.soran@tufts.edu", level: "Admin" },
    { name: "Molly Sikma", email: "molly.sikma@tufts.edu", level: "Standard" },
    { name: "LCS Tutoring", email: "lcs.tutor@gmail.com", level: "Admin" },
    { name: "Dilanur Bayraktar", email: "dilanur.bayraktar@tufts.edu", level: "Standard" },
    { name: "LCS Tutoring", email: "lcs.tutor@tufts.edu", level: "Admin" },
    { name: "Brandon Dionisio", email: "brandon.dionisio@tufts.edu", level: "Super Admin" },
  ];

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
          <Title order={2} fw={700}>Manage Admin</Title>
          <Button variant="default" radius="md">
            Add New Admin
          </Button>
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