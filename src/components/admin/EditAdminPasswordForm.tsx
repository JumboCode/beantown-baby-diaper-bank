"use client";

import { useState } from "react";
import { Alert, Button, Group, Modal, PasswordInput, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";

interface Admin {
  id: string;
  name: string;
  email: string;
  level: string;
  isAdmin: boolean;
}

interface FormValues {
  password: string;
  confirmPassword: string;
}

export default function EditAdminPasswordForm({ admin }: { admin: Admin }) {
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    initialValues: { password: "", confirmPassword: "" },
    validate: {
      password: (v) => (v.length < 8 ? "Password must be at least 8 characters" : null),
      confirmPassword: (v, values) => (v !== values.password ? "Passwords do not match" : null),
    },
  });

  const handleClose = () => {
    if (loading) return;
    form.reset();
    setServerError(null);
    close();
  };

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    setServerError(null);
    try {
      const response = await fetch(`/api/admin/${admin.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: values.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update password");
      }

      form.reset();
      close();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="subtle" size="xs" onClick={open}>
        Update password
      </Button>

      <Modal opened={opened} onClose={handleClose} title="Update password" centered size="lg">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Setting a new password for{" "}
              <Text span fw={600} c="dark">
                {admin.name}
              </Text>{" "}
              ({admin.email})
            </Text>

            <PasswordInput
              label="New password"
              placeholder="Min. 8 characters"
              {...form.getInputProps("password")}
            />

            <PasswordInput
              label="Confirm password"
              placeholder="Re-enter new password"
              {...form.getInputProps("confirmPassword")}
            />

            {serverError && (
              <Alert color="red" variant="light">
                {serverError}
              </Alert>
            )}

            <Group justify="flex-end" gap="sm" mt="xs">
              <Button variant="default" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Update password
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
