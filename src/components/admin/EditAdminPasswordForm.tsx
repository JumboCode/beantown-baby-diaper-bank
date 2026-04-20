"use client";

import { useState } from "react";
import { Button, Group, Modal, PasswordInput, Stack, Text, Alert } from "@mantine/core";
import { useForm } from "@mantine/form";

interface Admin {
  id: string;
  name: string;
  email: string;
  level: string;
  isAdmin: boolean;
}

interface EditAdminPasswordFormProps {
  admin: Admin;
}

interface FormValues {
  password: string;
  confirmPassword: string;
}

export default function EditAdminPasswordForm({ admin }: EditAdminPasswordFormProps) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validate: {
      password: (value) => (value.length < 8 ? "Password must be at least 8 characters" : null),
      confirmPassword: (value, values) =>
        value !== values.password ? "Passwords do not match" : null,
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      setServerError(null);

      const response = await fetch(`/api/admin/${admin.id}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update password");
      }

      form.reset();
      setOpened(false);
    } catch (err: any) {
      setServerError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="light" size="xs" onClick={() => setOpened(true)}>
        Update Password
      </Button>

      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false);
          setServerError(null);
          form.reset();
        }}
        title="Update Admin Password"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Text size="sm">
              Updating password for <strong>{admin.name}</strong> ({admin.email})
            </Text>

            {serverError && <Alert color="red">{serverError}</Alert>}

            <PasswordInput
              label="New Password"
              placeholder="Enter new password"
              {...form.getInputProps("password")}
            />

            <PasswordInput
              label="Confirm Password"
              placeholder="Re-enter new password"
              {...form.getInputProps("confirmPassword")}
            />

            <Group justify="flex-end" mt="sm">
              <Button
                variant="default"
                onClick={() => {
                  setOpened(false);
                  setServerError(null);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Update Password
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
