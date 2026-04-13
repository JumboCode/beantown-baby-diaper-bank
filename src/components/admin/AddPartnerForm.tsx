"use client";

import {
  Button,
  Group,
  TextInput,
  Text,
  Textarea,
  NumberInput,
  Radio,
  FileInput,
  Select,
  Modal,
  Title,
  Stack,
  SimpleGrid,
  LoadingOverlay,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { MonthPickerInput } from "@mantine/dates";
import { useEffect, useRef, useState } from "react";
import "@mantine/dates/styles.css";
import { fetchCoordsFromAddress } from "@/lib/util";
import CityPercentagesForm, { CityPercentage } from "./CityPercentagesForm";

const countries = ["United States", "Canada"];
const DEFAULT_COUNTRY = "United States";

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

type AddressFields = {
  addressLine: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

const buildAddressString = ({ addressLine, city, state, zipCode, country }: AddressFields) =>
  [addressLine, city, state, zipCode, country || DEFAULT_COUNTRY].filter(Boolean).join(", ");

const requiredNumber = (label: string) => (value: unknown) => {
  const v = (value === 0 ? "0" : (value ?? "")).toString().trim();
  if (v === "") return `${label} is required`;
  return /^-?\d+(\.\d+)?$/.test(v) ? null : `${label} must be a number`;
};

const requiredInteger = (label: string) => (value: unknown) => {
  const v = (value === 0 ? "0" : (value ?? "")).toString().trim();
  if (v === "") return `${label} is required`;
  return /^\d+$/.test(v) ? null : `${label} must be a number`;
};

export default function AddPartnerForm({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const [cityEntries, setCityEntries] = useState<CityPercentage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitWarning, setSubmitWarning] = useState<string>("");

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
      state: "",
      zipCode: "",
      country: DEFAULT_COUNTRY,
      logoFile: null as File | null,
      logoUrl: "",
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
      zipCode: requiredInteger("Zip Code"),
      country: (value) => (value ? null : "Select a country"),
      status: (value) => (value ? null : "Select a status"),
      logoUrl: (value, values) => {
        if (!value.trim() && !values.logoFile) return null;
        return typeof value === "string" ? null : "Enter a valid URL";
      },
    },
  });

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

  async function submitPartner(values: typeof form.values) {
    setIsSubmitting(true);
    setSubmitWarning("");

    if (values.status !== "waitlisted") {
      if (cityEntries.length === 0) {
        setSubmitWarning("Please add at least one city.");
        setIsSubmitting(false);
        return;
      }
      const total = cityEntries.reduce((sum, e) => sum + e.percent, 0);
      if (Math.abs(total - 100) > 0.01) {
        setSubmitWarning(`City percentages must add up to 100% (currently ${total.toFixed(0)}%)`);
        setIsSubmitting(false);
        return;
      }
    }

    // // Check for duplicate partner name before submitting.
    // try {
    //   const trimmedName = values.organization.trim();
    //   const checkRes = await fetch(`/api/partners?search=${encodeURIComponent(trimmedName)}`);
    //   if (checkRes.ok) {
    //     const checkData = await checkRes.json();
    //     const duplicate = checkData.data?.find(
    //       (p: { name: string }) => p.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    //     );
    //     if (duplicate) {
    //       const duplicateWarning = `The partner ${trimmedName} already exists.`;
    //       form.setFieldError("organization", duplicateWarning);
    //       setSubmitWarning(duplicateWarning);
    //       setIsSubmitting(false);
    //       return;
    //     }
    //   }
    // } catch {
    //   // If the check fails, allow the submission to proceed.
    // }

    const cityPercentages = cityEntries.map((e) => ({
      city: e.city,
      percentage: Number((e.percent / 100).toFixed(4)),
    }));

    const partnerPayload = {
      name: values.organization,
      description: values.description,
      start_partner: values.time,
      status: values.status,
      coordinates: {
        lat: Number(values.latitude),
        lng: Number(values.longitude),
      },
      address: buildAddressString(values),
      logo: values.logoUrl || "",
      cities: cityPercentages,
    };

    try {
      const requestBody = new FormData();
      requestBody.append("partner", JSON.stringify(partnerPayload));
      requestBody.append("logoAction", values.logoFile ? "replace" : "keep");
      if (values.logoFile) {
        requestBody.append("file", values.logoFile);
      }

      const response = await fetch("/api/partners", {
        method: "POST",
        body: requestBody,
      });

      if (!response.ok) {
        const err = await response.json();
        const warning = typeof err?.error === "string" ? err.error : "Unable to submit partner.";
        if (response.status === 422 || warning === "Please check the entered cities.") {
          const cityWarning = "Please check the entered cities.";
          setSubmitWarning(cityWarning);
          return;
        }
        form.setFieldError("logoFile", warning);
        setSubmitWarning(warning);
        return;
      }

      form.reset();
      form.setFieldValue("country", DEFAULT_COUNTRY);
      setCityEntries([]);
      setSubmitWarning("");
      onClose();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("partners:refresh"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
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

      <form onSubmit={form.onSubmit(submitPartner)}>
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
                  key={form.key("state")}
                  value={form.values.state || null}
                  onChange={(val) => form.setFieldValue("state", val || "")}
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
              Coords <span className="text-red-600">*</span>
            </Text>
            <Group w={526} grow>
              <NumberInput
                placeholder="Latitude"
                key={form.key("latitude")}
                value={form.values.latitude}
                onChange={(val) => form.setFieldValue("latitude", String(val))}
                error={form.errors.latitude}
                size="md"
                radius="md"
                hideControls
              />
              <NumberInput
                placeholder="Longitude"
                key={form.key("longitude")}
                value={form.values.longitude}
                onChange={(val) => form.setFieldValue("longitude", String(val))}
                error={form.errors.longitude}
                size="md"
                radius="md"
                hideControls
              />
            </Group>
          </Group>

          <Group justify="space-between" align="flex-start">
            <Text c="#344054" fz={16} fw={600}>
              Logo file or link
            </Text>
            <Group w={526} grow>
              <FileInput
                accept="image/png,image/jpeg"
                placeholder="Upload image file"
                radius="md"
                clearable
                onChange={(file) => handleFileChange(file)}
                error={form.errors.logoFile || form.errors.logoUrl}
                size="md"
              />
              <TextInput
                placeholder="Logo URL"
                key={form.key("logoUrl")}
                {...form.getInputProps("logoUrl")}
                radius="md"
                size="md"
              />
            </Group>
          </Group>

          {submitWarning && (
            <Group justify="flex-end" mt="xs">
              <Text c="red" size="sm">
                {submitWarning}
              </Text>
            </Group>
          )}
          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              color="#053766"
              radius="md"
              type="button"
              disabled={isSubmitting}
              onClick={() => {
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
            >
              Submit
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
