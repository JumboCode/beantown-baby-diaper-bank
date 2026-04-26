"use client";

import { useDisclosure } from "@mantine/hooks";
import { Modal } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Button, Group, TextInput, PasswordInput } from "@mantine/core";
import { useSignIn } from "@clerk/nextjs";

export default function AddNewAdminForm({ onAdminAdded }: { onAdminAdded?: () => void }) {
  const [opened, { open, close }] = useDisclosure(false);
  const { isLoaded } = useSignIn();

  const form = useForm({
    mode: "uncontrolled",
    validateInputOnChange: true,
    validateInputOnBlur: true,
    initialValues: {
      first: "",
      last: "",
      email: "",
      password: "",
    },

    validate: {
      first: (value) => (value ? null : "First name is required"),
      last: (value) => (value ? null : "Last name is required"),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) => (value.length >= 8 ? null : "Password must be at least 8 characters"),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (!isLoaded) return;

    try {
      const response = await fetch("/api/admin/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        const details = errorData?.errors?.map((e: any) => e.longMessage || e.message).join(" | ");
        throw new Error(details || errorData.message || "Failed to add admin");
      }

      form.reset();
      close();
      onAdminAdded?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error(errorMessage);
    }
  };

  return (
    <>
      <Modal opened={opened} onClose={close} title="Add New Admin" centered size="lg">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            withAsterisk
            label="First Name"
            placeholder="Jane"
            key={form.key("first")}
            {...form.getInputProps("first")}
          />
          <TextInput
            withAsterisk
            label="Last Name"
            placeholder="Smith"
            key={form.key("last")}
            {...form.getInputProps("last")}
          />
          <TextInput
            withAsterisk
            label="Email"
            placeholder="jane.smith@gmail.com"
            key={form.key("email")}
            {...form.getInputProps("email")}
          />
          <PasswordInput
            withAsterisk
            label="Password"
            key={form.key("password")}
            {...form.getInputProps("password")}
          />

          <Group justify="flex-end" mt="md">
            <Button type="submit">Submit</Button>
          </Group>
        </form>
      </Modal>

      <Button variant="default" onClick={open}>
        Add New Admin
      </Button>
    </>
  );
}
