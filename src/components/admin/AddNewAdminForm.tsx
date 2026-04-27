"use client";

import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { Alert, Button, Group, Modal, PasswordInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useSignIn } from "@clerk/nextjs";

export default function AddNewAdminForm({ onAdminAdded }: { onAdminAdded?: () => void }) {
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { isLoaded } = useSignIn();

  const form = useForm({
    mode: "uncontrolled",
    validateInputOnChange: true,
    validateInputOnBlur: true,
    initialValues: { first: "", last: "", email: "", password: "" },
    validate: {
      first: (v) => (v.trim() ? null : "First name is required"),
      last: (v) => (v.trim() ? null : "Last name is required"),
      email: (v) => (/^\S+@\S+$/.test(v) ? null : "Invalid email"),
      password: (v) => (v.length >= 8 ? null : "Password must be at least 8 characters"),
    },
  });

  const handleClose = () => {
    if (loading) return;
    form.reset();
    setServerError(null);
    close();
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!isLoaded) return;
    setLoading(true);
    setServerError(null);
    try {
      const response = await fetch("/api/admin/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.first.trim(),
          lastName: values.last.trim(),
          email: values.email.trim(),
          password: values.password,
          level: "admin",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const details = errorData?.errors
          ?.map((e: { longMessage?: string; message?: string }) => e.longMessage || e.message)
          .join(" | ");
        throw new Error(details || errorData.message || "Failed to add admin");
      }

      form.reset();
      close();
      onAdminAdded?.();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="default" onClick={open}>
        Add new admin
      </Button>

      <Modal opened={opened} onClose={handleClose} title="Add new administrator" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Group grow gap="sm">
              <TextInput
                withAsterisk
                label="First name"
                placeholder="Jane"
                key={form.key("first")}
                {...form.getInputProps("first")}
              />
              <TextInput
                withAsterisk
                label="Last name"
                placeholder="Smith"
                key={form.key("last")}
                {...form.getInputProps("last")}
              />
            </Group>

            <TextInput
              withAsterisk
              label="Email"
              placeholder="jane.smith@example.com"
              key={form.key("email")}
              {...form.getInputProps("email")}
            />

            <PasswordInput
              withAsterisk
              label="Password"
              placeholder="Min. 8 characters"
              key={form.key("password")}
              {...form.getInputProps("password")}
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
                Add admin
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
