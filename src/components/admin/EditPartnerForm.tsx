"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Group,
  LoadingOverlay,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { DateValue, MonthPickerInput } from "@mantine/dates";
import { status } from "@/generated/prisma/enums";
import { fetchCoordsFromAddress } from "@/lib/util";

const DEFAULT_COUNTRY = "United States";

const COUNTRIES = ["United States", "Canada"];

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

type Partner = {
  id: number;
  name: string;
  description: string | null;
  start_partner: string | null;
  end_partner?: string | null;
  status: status;
  address: string | null;
  coords?: { lat: number; lng: number };
  logo_url: string | null;
};

type EditPartnerFormProps = {
  partner: Partner;
  onClose: () => void;
};

type EditPartnerFormValues = {
  organization: string;
  description: string;
  status: status;
  time: Date | null;
  endTime: Date | null;
  latitude: string;
  longitude: string;
  addressLine: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  logoUrl: string;
};

type AddressFields = {
  addressLine: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

const parseAddressFields = (address: string | null): AddressFields => {
  const defaults: AddressFields = {
    addressLine: "",
    city: "",
    state: "",
    zipCode: "",
    country: DEFAULT_COUNTRY,
  };

  if (!address) return defaults;

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    addressLine: parts[0] || "",
    city: parts[1] || "",
    state: parts[2] || "",
    zipCode: parts[3] || "",
    country: parts[4] || DEFAULT_COUNTRY,
  };
};

const buildAddressString = ({
  addressLine,
  city,
  state,
  zipCode,
  country,
}: AddressFields) =>
  [addressLine, city, state, zipCode, country || DEFAULT_COUNTRY]
    .filter(Boolean)
    .join(", ");

const requiredInput = (label: string) => (value: unknown) => {
  const normalized = (value ?? "").toString().trim();
  return normalized ? null : `${label} is required`;
};

const requiredNumber = (label: string) => (value: unknown) => {
  const normalized = (value ?? "").toString().trim();
  if (!normalized) return `${label} is required`;
  return /^-?\d+(\.\d+)?$/.test(normalized)
    ? null
    : `${label} must be a number`;
};

const requiredInteger = (label: string) => (value: unknown) => {
  const normalized = (value ?? "").toString().trim();
  if (!normalized) return `${label} is required`;
  return /^\d+$/.test(normalized) ? null : `${label} must be a number`;
};

const parseMonthDateForPicker = (
  rawDate: string | null | undefined,
): Date | null => {
  if (!rawDate) return null;

  const monthMatch = rawDate.match(/^(\d{4})-(\d{2})/);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const monthIndex = Number(monthMatch[2]) - 1;
    return new Date(Date.UTC(year, monthIndex, 1, 12));
  }

  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatMonthDateForApi = (date: Date | null): string | null => {
  if (!date) return null;

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
};

const toDate = (value: DateValue | null): Date | null => {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
};

export default function EditPartnerForm({
  partner,
  onClose,
}: EditPartnerFormProps) {
  const [loading, setLoading] = useState(false);
  const addressFields = parseAddressFields(partner.address);

  const form = useForm<EditPartnerFormValues>({
    mode: "controlled",
    validateInputOnChange: true,
    validateInputOnBlur: true,
    initialValues: {
      organization: partner.name,
      description: partner.description || "",
      status: partner.status,
      time: parseMonthDateForPicker(partner.start_partner),
      endTime: parseMonthDateForPicker(partner.end_partner || null),
      latitude: partner.coords ? String(partner.coords.lat) : "",
      longitude: partner.coords ? String(partner.coords.lng) : "",
      addressLine: addressFields.addressLine,
      city: addressFields.city,
      state: addressFields.state,
      zipCode: addressFields.zipCode,
      country: addressFields.country,
      logoUrl: partner.logo_url || "",
    },
    validate: {
      organization: requiredInput("Name of Organization"),
      description: requiredInput("Description"),
      status: (value) => (value ? null : "Select a status"),
      time: (value, values) =>
        values.status === "waitlisted" || value ? null : "Select a start time",
      endTime: (value, values) =>
        values.status === "inactive" && !value ? "Select an end time" : null,
      latitude: requiredNumber("Latitude"),
      longitude: requiredNumber("Longitude"),
      addressLine: requiredInput("Address Line"),
      city: requiredInput("City"),
      state: requiredInput("State"),
      zipCode: requiredInteger("Zip Code"),
      country: requiredInput("Country"),
    },
  });

  useEffect(() => {
    const { addressLine, city, state, zipCode, country } = form.values;
    if (!addressLine || !city || !state || !zipCode) return;

    const fullAddress = buildAddressString({
      addressLine,
      city,
      state,
      zipCode,
      country,
    });

    fetchCoordsFromAddress(fullAddress).then((location) => {
      if (!location) return;
      form.setFieldValue("latitude", String(location.lat));
      form.setFieldValue("longitude", String(location.lng));
    });
  }, [
    form.values.addressLine,
    form.values.city,
    form.values.state,
    form.values.zipCode,
    form.values.country,
  ]);

  async function submitEditPartner(values: typeof form.values) {
    setLoading(true);

    try {
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: partner.id,
          name: values.organization,
          description: values.description,
          status: values.status,
          start_partner:
            values.status !== "waitlisted"
              ? formatMonthDateForApi(values.time)
              : null,
          end_partner:
            values.status === "inactive"
              ? formatMonthDateForApi(values.endTime)
              : null,
          coordinates: {
            lat: Number(values.latitude),
            lng: Number(values.longitude),
          },
          address: buildAddressString(values),
          logo: values.logoUrl,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(errorBody?.error || "Failed to update partner");
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("partners:refresh"));
      }

      onClose();
    } catch (error) {
      console.error("Failed to update partner:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.onSubmit(submitEditPartner)}>
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ blur: 2 }} />

      <Stack>
        <Text c="#667085" size="sm">
          Update partner information
        </Text>

        <Select
          label="Status"
          data={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "waitlisted", label: "Waitlisted" },
          ]}
          {...form.getInputProps("status")}
        />

        <TextInput
          label="Name of Organization"
          {...form.getInputProps("organization")}
        />

        <Textarea
          label="Description"
          autosize
          minRows={3}
          {...form.getInputProps("description")}
        />

        {form.values.status !== "waitlisted" && (
          <MonthPickerInput
            label="Start Month"
            placeholder="Pick a month"
            value={form.values.time}
            onChange={(value) => form.setFieldValue("time", toDate(value))}
          />
        )}

        {form.values.status === "inactive" && (
          <MonthPickerInput
            label="End Month"
            placeholder="Pick a month"
            value={form.values.endTime}
            onChange={(value) => form.setFieldValue("endTime", toDate(value))}
          />
        )}

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput label="Address Line" {...form.getInputProps("addressLine")} />
          <TextInput label="City" {...form.getInputProps("city")} />
          <Select
            label="State"
            data={US_STATES}
            searchable
            {...form.getInputProps("state")}
          />
          <TextInput label="Zip Code" {...form.getInputProps("zipCode")} />
          <Select
            label="Country"
            data={COUNTRIES}
            searchable
            {...form.getInputProps("country")}
          />
          <TextInput label="Logo URL" {...form.getInputProps("logoUrl")} />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput label="Latitude" {...form.getInputProps("latitude")} />
          <TextInput label="Longitude" {...form.getInputProps("longitude")} />
        </SimpleGrid>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" color="#053766">
            Save Changes
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
