"use client";

import {
  Table,
  Container,
  Title,
  Group,
  Paper,
  Stack,
  Alert,
  Text,
  Badge,
  Box,
  Tooltip,
} from "@mantine/core";
import AddNewAdminForm from "@/components/admin/AddNewAdminForm";
import DeleteAdminModal from "@/components/admin/DeleteAdminModal";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { X, UserX } from "lucide-react";
import classes from "./page.module.css";
import EditAdminPasswordForm from "@/components/admin/EditAdminPasswordForm";

interface Admin {
  id: string;
  name: string;
  email: string;
  level: string;
  isAdmin: boolean;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();
}

export default function AdminControlsPage() {
  const { user } = useUser();

  const [adminList, setAdminList] = useState<Admin[]>([]);
  const [error, setError] = useState<string | null>(null);

  const currentRole =
    typeof user?.publicMetadata?.role === "string" ? user.publicMetadata.role : "user";
  const canDeleteAdmins = currentRole === "superadmin";
  const currentRoleLabel =
    currentRole === "superadmin" ? "Super Admin" : currentRole === "admin" ? "Admin" : "Member";

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admin/list");
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch admins");
      setAdminList(data.admins);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert color="red">{error}</Alert>
      </Container>
    );
  }

  const rows = adminList.map((element, index) => (
    <Table.Tr key={`${element.email}-${index}`}>
      <Table.Td>
        <Badge
          radius="xl"
          color={element.level.toLowerCase() === "superadmin" ? "#6366f1" : "#3b82f6"}
          variant="filled"
        >
          {element.level}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          <div className={classes.avatar}>{getInitials(element.name)}</div>
          <Stack gap={2}>
            <Text fw={600} size="sm">
              {element.name}
            </Text>
            <Text size="xs" c="dimmed">
              {element.email}
            </Text>
          </Stack>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group>
          <EditAdminPasswordForm admin={element} />
          {canDeleteAdmins ? (
            <DeleteAdminModal
              adminId={element.id}
              adminName={element.name}
              adminEmail={element.email}
              onDeleted={() => setAdminList((prev) => prev.filter((a) => a.id !== element.id))}
            />
          ) : null}
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="xl" m="xl">
      {/* ── Hero ── */}
      <Paper className={classes.hero} p="xl">
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start">
            <Stack gap={8}>
              <div>
                <Text className={classes.eyebrow}>Admin Management</Text>
                <Title order={2} fw={700} className={classes.heroTitle}>
                  Manage administrator access
                </Title>
                <Text className={classes.heroSubtitle}>
                  Review account access, add new admins, or remove admins
                </Text>
              </div>
            </Stack>
            <Tooltip label="My access level" withArrow>
              <Badge color="white" variant="outline" size="xl">
                {currentRoleLabel}
              </Badge>
            </Tooltip>
          </Group>
        </Stack>
      </Paper>

      {/* ── Table ── */}
      <Paper withBorder p="md" className={classes.tableCard}>
        <Stack gap="md">
          <Group justify="space-between" align="center" className={classes.tableHeader} pb="sm">
            <div>
              <Group gap="sm" align="center" mb={4}>
                <Title order={3} className={classes.sectionTitle}>
                  Admin directory
                </Title>
              </Group>
            </div>
            <AddNewAdminForm onAdminAdded={fetchAdmins} />
          </Group>

          <Table.ScrollContainer minWidth={1000} maxHeight="55vh">
            <Table verticalSpacing="sm" highlightOnHover stickyHeader>
              <Table.Thead className={classes.tableHead}>
                <Table.Tr>
                  <Table.Th>Level</Table.Th>
                  <Table.Th>Administrator</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Stack>
      </Paper>
    </Stack>
  );
}
