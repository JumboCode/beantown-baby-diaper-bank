"use client";

import {
  Alert,
  Button,
  Group,
  TextInput,
  Text,
  Textarea,
  NumberInput,
  Radio,
  Select,
  Modal,
  Title,
  Stack,
  SimpleGrid,
  LoadingOverlay,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import LogoDropzone from "./LogoDropzone";
import { useForm } from "@mantine/form";
import { MonthPickerInput } from "@mantine/dates";
import { useEffect, useRef, useState } from "react";
import "@mantine/dates/styles.css";
import { fetchCoordsFromAddress } from "@/lib/util";
import CityPercentagesForm, { CityPercentage } from "./CityPercentagesForm";
import { US_STATES } from "@/lib/types";
import { buildAddressString, usePartnerSubmit } from "@/hooks/admin/usePartnerSubmit";

const countries = ["United States", "Canada"];
const DEFAULT_COUNTRY = "United States";
const DEFAULT_STATE = "MA";

const requiredNumber = (label: string) => (value: unknown) => {
  const v = (value === 0 ? "0" : (value ?? "")).toString().trim();
  if (v === "") return `${label} is required`;
  return /^-?\d+(\.\d+)?$/.test(v) ? null : `${label} must be a number`;
};

export default function AddPartnerForm({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const [cityEntries, setCityEntries] = useState<CityPercentage[]>([]);

  const form = useForm({
    mode: "controlled",
    validateInputOnBlur: true,
    initialValues: {
      organization: "",
      description: "",
      time: null as Date | null,
      status: "",
      latitude: "",
      longitude: "",
      addressLine: "",
      city: "",
      state: DEFAULT_STATE,
      zipCode: "",
      country: DEFAULT_COUNTRY,
      logoFile: null as File | null,
      logoUrl: "",
      numBabies: "" as number | "",
    },
    validate: {
      organization: (value) =>
        typeof value === "string" && value.trim() ? null : "Organization name is required",
      time: (value, values) => {
        if (values.status === "waitlisted") return null;
        return value ? null : "Select a start time";
      },
      latitude: requiredNumber("Latitude"),
      longitude: requiredNumber("Longitude"),
      state: (value) => (value ? null : "Select a state"),
      city: (value) => (value.trim() ? null : "City is required"),
      addressLine: (value) => (value.trim() ? null : "Address Line is required"),
      zipCode: (value: string) =>
        /^\d{5}(-\d{4})?$/.test(value.trim())
          ? null
          : "Zip Code must be a valid US zip code (e.g. 02101)",
      country: (value) => (value ? null : "Select a country"),
      status: (value) => (value ? null : "Select a status"),
      logoUrl: (value, values) => {
        if (!value.trim() && !values.logoFile) return null;
        return typeof value === "string" ? null : "Enter a valid URL";
      },
    },
  });

  const {
    submit,
    confirmAndSubmit,
    clearSimilarMatch,
    isSubmitting,
    warning: submitWarning,
    similarMatch,
  } = usePartnerSubmit({
    cityEntries,
    onSuccess: () => {
      form.reset();
      form.setFieldValue("country", DEFAULT_COUNTRY);
      setCityEntries([]);
      window.dispatchEvent(new CustomEvent("partners:refresh"));
      onClose();
    },
    onFieldError: (field, message) => form.setFieldError(field, message),
  });

  function handleClose() {
    clearSimilarMatch();
    onClose();
  }

  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const { addressLine, city, state, zipCode, country } = form.values;
    if (!addressLine || !city || !state || !zipCode) return;

    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(() => {
      const fullAddress = buildAddressString({ addressLine, city, state, zipCode, country });
      fetchCoordsFromAddress(fullAddress).then((location) => {
        if (!location) return;
        form.setFieldValue("latitude", String(location.lat));
        form.setFieldValue("longitude", String(location.lng));
      });
    }, 600);

    return () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    };
  }, [
    form.values.addressLine,
    form.values.city,
    form.values.state,
    form.values.zipCode,
    form.values.country,
  ]);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      form.setFieldValue("logoFile", null);
      form.setFieldValue("logoUrl", "");
      form.clearFieldError("logoFile");
      return;
    }
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      form.setFieldError("logoFile", "Only PNG or JPEG types are accepted");
      return;
    }
    form.setFieldValue("logoFile", file);
    form.clearFieldError("logoFile");
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size={990}
      padding={32}
      title={
        <Text fw={700} size="30px" c="#101828">
          Add New Partner
        </Text>
      }
    >
      <Title order={2} c="#667085" fw="normal" fz={18} mb="md">
        Add your new partner data
      </Title>
      <LoadingOverlay
        visible={isSubmitting}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />

      <form onSubmit={form.onSubmit(submit)}>
        <Stack>
          <Group justify="space-between" align="flex-start" w="100%">
            <Text c="#344054" fz={16} fw={600}>
              Status <span className="text-red-600">*</span>
            </Text>

            <Radio.Group
              value={form.values.status}
              onChange={(val) => form.setFieldValue("status", val)}
              w={526}
            >
              <Group gap="md" grow>
                {[
                  { value: "active", title: "Active", description: "Currently active" },
                  { value: "waitlisted", title: "Waitlisted", description: "On the waitlist" },
                ].map((option) => (
                  <Radio.Card
                    key={option.value}
                    value={option.value}
                    radius="md"
                    p="md"
                    className="border border-gray-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md data-[checked=true]:border-[#053766] data-[checked=true]:bg-blue-50 h-full"
                  >
                    <Group wrap="nowrap" align="flex-start" gap="sm">
                      <Radio.Indicator />
                      <Stack gap={4}>
                        <Text fw={700}>{option.title}</Text>
                        <Text size="xs" c="dimmed">
                          {option.description}
                        </Text>
                      </Stack>
                    </Group>
                  </Radio.Card>
                ))}
              </Group>
              {form.errors.status && (
                <Text c="red" size="sm" mt="xs">
                  {form.errors.status}
                </Text>
              )}
            </Radio.Group>
          </Group>

          <Group justify="space-between" align="flex-start">
            <Text c="#344054" fz={16} fw={600}>
              Name of Organization <span className="text-red-600">*</span>
            </Text>
            <TextInput
              placeholder="Name"
              key={form.key("organization")}
              {...form.getInputProps("organization")}
              size="md"
              w={526}
              radius="md"
              required
            />
          </Group>

          <Group justify="space-between" align="flex-start">
            <Text c="#344054" fz={16} fw={600}>
              Description <span className="text-red-600">*</span>
            </Text>
            <Textarea
              placeholder="Description"
              key={form.key("description")}
              {...form.getInputProps("description")}
              size="md"
              w={526}
              radius="md"
              required
              autosize
              maxRows={6}
            />
          </Group>

          {form.values.status !== "waitlisted" && (
            <Group justify="space-between" align="flex-start">
              <Text c="#344054" fz={16} fw={600}>
                Cities Served <span className="text-red-600">*</span>
              </Text>
              <div style={{ width: 526 }}>
                <CityPercentagesForm onChange={setCityEntries} />
              </div>
            </Group>
          )}

          {form.values.status !== "waitlisted" && (
            <Group justify="space-between" align="flex-start">
              <Text c="#344054" fz={16} fw={600}>
                Time it started <span className="text-red-600">*</span>
              </Text>
              <MonthPickerInput
                placeholder="Pick date"
                value={form.values.time}
                onChange={(val) => form.setFieldValue("time", val as Date | null)}
                error={form.errors.time}
                required
                w={526}
              />
            </Group>
          )}

          <Group justify="space-between" align="flex-start">
            <Text c="#344054" fz={16} fw={600}>
              Number of Babies Helped Per Month
            </Text>
            <NumberInput
              placeholder="Approximate Number of Babies Helped Per Month"
              min={0}
              value={form.values.numBabies}
              onChange={(val) =>
                form.setFieldValue("numBabies", typeof val === "number" ? val : "")
              }
              size="md"
              w={526}
              radius="md"
              hideControls
            />
          </Group>

          <Group justify="space-between" align="flex-start">
            <Text c="#344054" fz={16} fw={600}>
              Address <span className="text-red-600">*</span>
            </Text>
            <Stack>
              <TextInput
                placeholder="Address Line"
                key={form.key("addressLine")}
                {...form.getInputProps("addressLine")}
                size="md"
                w={526}
                radius="md"
                required
              />
              <SimpleGrid w={526} cols={2}>
                <TextInput
                  placeholder="City"
                  key={form.key("city")}
                  {...form.getInputProps("city")}
                  size="md"
                  radius="md"
                  required
                />
                <Select
                  placeholder="State"
                  data={US_STATES}
                  searchable
                  defaultValue={DEFAULT_STATE}
                  key={form.key("state")}
                  value={form.values.state || DEFAULT_STATE}
                  onChange={(val) => form.setFieldValue("state", val || DEFAULT_STATE)}
                  error={form.errors.state}
                  size="md"
                  radius="md"
                  required
                />
                <TextInput
                  placeholder="Zip Code"
                  key={form.key("zipCode")}
                  value={form.values.zipCode}
                  onChange={(event) => form.setFieldValue("zipCode", event.currentTarget.value)}
                  error={form.errors.zipCode}
                  size="md"
                  radius="md"
                />
                <Select
                  placeholder="Country"
                  data={countries}
                  searchable
                  nothingFoundMessage="Nothing found..."
                  key={form.key("country")}
                  value={form.values.country || null}
                  onChange={(val) => form.setFieldValue("country", val || "")}
                  error={form.errors.country}
                  size="md"
                  radius="md"
                />
              </SimpleGrid>
            </Stack>
          </Group>

          <Group justify="space-between" align="flex-start">
            <Text c="#344054" fz={16} fw={600}>
              Logo
            </Text>
            <div style={{ width: 526 }}>
              <LogoDropzone
                file={form.values.logoFile}
                onChange={(file) => handleFileChange(file)}
                error={
                  form.errors.logoFile
                    ? String(form.errors.logoFile)
                    : form.errors.logoUrl
                      ? String(form.errors.logoUrl)
                      : undefined
                }
              />
            </div>
          </Group>

          {submitWarning && (
            <Group justify="flex-end" mt="xs">
              <Text c="red" size="sm">
                {submitWarning}
              </Text>
            </Group>
          )}

          {similarMatch && (
            <Alert
              icon={<IconAlertTriangle size={16} />}
              title="Possible duplicate partner"
              color="yellow"
              radius="md"
              mt="xs"
            >
              <Text size="sm" mb="sm">
                A partner named <strong>&ldquo;{similarMatch}&rdquo;</strong> already exists with a
                similar name. Double-check this is a new organization before continuing.
              </Text>
              <Group gap="sm">
                <Button size="xs" variant="outline" color="gray" onClick={clearSimilarMatch}>
                  Go Back
                </Button>
                <Button size="xs" color="orange" onClick={confirmAndSubmit} loading={isSubmitting}>
                  Submit Anyway
                </Button>
              </Group>
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              color="#053766"
              radius="md"
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                clearSimilarMatch();
                form.reset();
                form.setFieldValue("country", DEFAULT_COUNTRY);
                setCityEntries([]);
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              color="#053766"
              radius="md"
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting || !!similarMatch}
            >
              Submit
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
