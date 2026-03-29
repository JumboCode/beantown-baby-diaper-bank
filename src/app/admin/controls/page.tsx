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
  Text,
  Badge,
  SimpleGrid,
  ThemeIcon,
  Tooltip,
  Box,
} from "@mantine/core";
import Image from "next/image";
import { Poppins } from "next/font/google";
import AddNewAdminForm from "@/components/admin/AddNewAdminForm";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Shield, Users, Crown, ChevronLeft } from "lucide-react";
import classes from "./page.module.css";

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
  const { user, isLoaded } = useUser();

  const [adminList, setAdminList] = useState<Admin[]>([]);

  const [error, setError] = useState<string | null>(null);

  const currentRole =
    typeof user?.publicMetadata?.role === "string"
      ? user.publicMetadata.role
      : "user";
  const canDeleteAdmins = currentRole === "superadmin";
  const currentRoleLabel =
    currentRole === "superadmin"
      ? "Super Admin"
      : currentRole === "admin"
        ? "Admin"
        : "Member";
  const superAdminCount = adminList.filter(
    (admin) => admin.level.toLowerCase() === "superadmin",
  ).length;

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
      <Table.Td>
        <Badge
          radius="xl"
          color={element.level.toLowerCase() === "superadmin" ? "#6366f1" : "#3b82f6"}
          variant="light"
        >
          {element.level}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Stack gap={2}>
          <Text fw={600} size="sm">
            {element.name}
          </Text>
          <Text size="xs" c="dimmed">
            {element.email}
          </Text>
        </Stack>
      </Table.Td>
      <Table.Td>
        {canDeleteAdmins ? (
          <ActionIcon
            variant="light"
            onClick={() => handleDelete(element.id)}
            aria-label={`Delete ${element.email}`}
            radius="xl"
            size="lg"
          >
            <Image
              src="/admin_view/delete.svg"
              alt="delete icon"
              width={20}
              height={20}
            />
          </ActionIcon>
        ) : (
          <Text size="xs" c="dimmed" fw={500}>
            Superadmin only
          </Text>
        )}
      </Table.Td>
    </Table.Tr>
  ));

  if (!isLoaded) {
    return null;
  }

  return (
    <Container size="xl" py="xl" className={poppins.className}>
      <Stack gap="xl">
        <Paper className={classes.hero} radius="xl" p="xl">
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start">
              <Stack gap={8}>
                <Button
                  variant="subtle"
                  color="gray"
                  leftSection={<ChevronLeft size={16} />}
                  onClick={() => router.back()}
                  className={classes.backButton}
                >
                  Back
                </Button>
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
              <AddNewAdminForm onAdminAdded={fetchAdmins} />
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Paper className={classes.myAccessCard} radius="xl" p="lg">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text className={classes.statLabel}>My access</Text>
                    <Text className={classes.statValue}>{currentRoleLabel}</Text>
                  </div>
                  <ThemeIcon color="blue" variant="light" radius="xl" size={42}>
                    <Shield size={20} />
                  </ThemeIcon>
                </Group>
              </Paper>

              <Paper className={classes.statCard} radius="xl" p="lg">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text className={classes.statLabel}>Admin accounts</Text>
                    <Text className={classes.statValue}>{adminList.length}</Text>
                  </div>
                  <ThemeIcon color="teal" variant="light" radius="xl" size={42}>
                    <Users size={20} />
                  </ThemeIcon>
                </Group>
              </Paper>
              <Tooltip label="Superadmins can delete other admins" withArrow>
                <Paper className={classes.statCard} radius="xl" p="lg">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Text className={classes.statLabel}>Superadmins</Text>
                      <Text className={classes.statValue}>{superAdminCount}</Text>
                    </div>
                    <ThemeIcon color="violet" variant="light" radius="xl" size={42}>
                      <Crown size={20} />
                    </ThemeIcon>
                  </Group>
                </Paper>
              </Tooltip>
            </SimpleGrid>
          </Stack>
        </Paper>

        <Paper withBorder radius="xl" p="md" className={classes.tableCard}>
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <div>
                <Title order={3} className={classes.sectionTitle}>
                  Admin directory
                </Title>
                <Text size="sm" c="dimmed">
                  Names, emails, and access levels.
                </Text>
              </div>
            </Group>

            <Box className={classes.tableWrap}>
              <Table verticalSpacing="md" highlightOnHover>
                <Table.Thead className={classes.tableHead}>
                  <Table.Tr>
                    <Table.Th>Level</Table.Th>
                    <Table.Th>Administrator</Table.Th>
                    <Table.Th>Delete</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
