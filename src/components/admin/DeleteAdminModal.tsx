"use client";

import { useState } from "react";
import { Alert, Button, Group, Modal, Stack, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { useUser } from "@clerk/nextjs";
import { TriangleAlert } from "lucide-react";

interface DeleteAdminModalProps {
  adminId: string;
  adminName: string;
  adminEmail: string;
  onDeleted: () => void;
}

export default function DeleteAdminModal({
  adminId,
  adminName,
  adminEmail,
  onDeleted,
}: DeleteAdminModalProps) {
  const { user } = useUser();
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSelf = user?.id === adminId;

  const handleClose = () => {
    if (loading) return;
    setError(null);
    close();
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/add", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: adminId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete admin");
      }

      close();
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    if (isSelf) {
      modals.openConfirmModal({
        title: "Remove your own account?",
        centered: true,
        children: (
          <Stack gap="sm">
            <Group gap="xs" align="center">
              <TriangleAlert size={16} color="var(--mantine-color-red-6)" />
              <Text size="sm" fw={600} c="red.7">
                You are removing yourself
              </Text>
            </Group>
            <Text size="sm" c="dimmed">
              You are about to permanently remove your own admin account (
              <Text span fw={600} c="dark" component="span">
                {adminEmail}
              </Text>
              ). You will be immediately signed out and lose all access to this dashboard.
            </Text>
            <Text size="sm" c="dimmed">
              Another superadmin will need to re-add you if this is a mistake.
            </Text>
          </Stack>
        ),
        labels: { confirm: "Yes, remove my account", cancel: "Cancel" },
        confirmProps: { color: "red" },
        onConfirm: open,
      });
    } else {
      open();
    }
  };

  return (
    <>
      <Tooltip label={`Remove ${adminEmail} from admin list`} withArrow>
        <Button
          variant="subtle"
          color="brandRed"
          onClick={handleOpen}
          aria-label={`Delete ${adminEmail}`}
          size="xs"
        >
          Delete account
        </Button>
      </Tooltip>

      <Modal opened={opened} onClose={handleClose} title="Remove administrator" centered size="lg">
        <Stack gap="lg">
          <Stack gap="xs">
            <Group gap="xs" align="center">
              <TriangleAlert size={16} color="var(--mantine-color-red-6)" />
              <Text size="sm" fw={600} c="red.7">
                This action cannot be undone
              </Text>
            </Group>
            <Text size="sm" c="dimmed">
              You are about to permanently remove{" "}
              <Text span fw={600} c="dark">
                {adminName}
              </Text>{" "}
              ({adminEmail}) from the admin list. They will immediately lose access to this
              dashboard.
            </Text>
          </Stack>

          {error && (
            <Alert color="red" variant="light">
              {error}
            </Alert>
          )}

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button color="red" loading={loading} onClick={handleDelete}>
              Remove admin
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
