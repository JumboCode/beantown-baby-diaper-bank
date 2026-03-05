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
  Stack,
  LoadingOverlay,
  Box,
  Tabs,
  SimpleGrid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { MonthPickerInput } from "@mantine/dates";
import { Partner } from "./PartnerTable";
import { useEffect, useState } from "react";
import { status } from "@/generated/prisma/enums";
import OneTimeUpdateForm from "./OneTimeUpdateForm";
import ContinuousUpdateForm from "./ContinuousUpdateForm";
import type { CityPercentage } from "./CityPercentagesForm";
import "@mantine/dates/styles.css";
import { RiCalendarEventLine, RiLineChartLine } from "react-icons/ri";

interface EditPartnerFormProps {
  partner: Partner;
  onClose: () => void;
}

const countries = ["United States", "Canada"];
const DEFAULT_COUNTRY = "United States";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

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

  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
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
    .filter((part) => Boolean(part))
    .join(", ");

const fetchCoordsFromAddress = async (address: string) => {
  const apiKey = "580b89e66bc6968ea58bac6909e6598c898970a";
  try {
    const response = await fetch(
      `https://api.geocod.io/v1.9/geocode?q=${encodeURIComponent(address)}&api_key=${apiKey}`
    );
    const data = await response.json();
    return data.results?.[0]?.location;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
};

const parseMonthDateForPicker = (rawDate: string | null | undefined): Date | null => {
  if (!rawDate) return null;
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatMonthDateForApi = (date: Date | null): string | null => {
  if (!date) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
};

export default function EditPartnerForm({ partner, onClose }: EditPartnerFormProps) {
  const [loading, setLoading] = useState(false);
  const [initialLogoUrl] = useState<string>(partner.logo_url || "");
  const [activePercentTab, setActivePercentTab] = useState<"one-time" | "continuous">("one-time");
  const [cityPercentages, setCityPercentages] = useState<any[]>([]);

  const addressFields = parseAddressFields(partner.address);

  const form = useForm({
    mode: "controlled",
    initialValues: {
      organization: partner.name,
      description: partner.description || "",
      time: parseMonthDateForPicker(partner.start_partner),
      endTime: parseMonthDateForPicker(partner.end_partner),
      status: partner.status,
      latitude: partner.coords ? String(partner.coords.lat) : "",
      longitude: partner.coords ? String(partner.coords.lng) : "",
      addressLine: addressFields.addressLine,
      city: addressFields.city,
      state: addressFields.state,
      zipCode: addressFields.zipCode,
      country: addressFields.country,
      logoFile: null as File | null,
      logoUrl: partner.logo_url || "",
    },
  });

  // Auto-populate Coordinates Logic
  useEffect(() => {
    const { addressLine, city, state, zipCode } = form.values;
    if (addressLine && city && state && zipCode) {
      const fullAddress = `${addressLine}, ${city}, ${state} ${zipCode}`;
      fetchCoordsFromAddress(fullAddress).then((location) => {
        if (location) {
          form.setFieldValue("latitude", String(location.lat));
          form.setFieldValue("longitude", String(location.lng));
        }
      });
    }
  }, [form.values.addressLine, form.values.city, form.values.state, form.values.zipCode]);

  async function submitEditPartner(values: typeof form.values) {
    setLoading(true);
    const formData = {
      id: partner.id,
      name: values.organization,
      description: values.description,
      start_partner: values.status !== "waitlisted" ? formatMonthDateForApi(values.time) : null,
      end_partner: values.status === "inactive" ? formatMonthDateForApi(values.endTime) : null,
      status: values.status,
      coordinates: { lat: Number(values.latitude), lng: Number(values.longitude) },
      address: buildAddressString(values),
      logo: values.logoUrl,
    };

    const logoAction = values.logoFile ? "replace" : (initialLogoUrl && !values.logoUrl ? "remove" : "keep");

    try {
      const body = new FormData();
      body.append("partner", JSON.stringify(formData));
      body.append("logoAction", logoAction);
      if (values.logoFile) body.append("file", values.logoFile);

      const res = await fetch("/api/partners", { method: "POST", body });
      if (res.ok) {
        window.dispatchEvent(new Event("partners:refresh"));
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(submitEditPartner)} className="flex flex-col gap-5 mx-8">
        <Group justify="space-between">
          <Text fw={600}>Status *</Text>
          <Radio.Group {...form.getInputProps("status")} w={526}>
            <Group grow>
              <Radio value="active" label="Active" />
              <Radio value="inactive" label="Inactive" />
              <Radio value="waitlisted" label="Waitlisted" />
            </Group>
          </Radio.Group>
        </Group>

        <Group justify="space-between">
          <Text fw={600}>Organization Name *</Text>
          <TextInput {...form.getInputProps("organization")} w={526} radius="md" />
        </Group>

        <Group justify="space-between">
          <Text fw={600}>Description *</Text>
          <Textarea {...form.getInputProps("description")} w={526} radius="md" autosize />
        </Group>

        {/* REORDERED: Address Fields above Coords */}
        <Group justify="space-between" align="flex-start">
          <Text fw={600}>Address *</Text>
          <Stack w={526}>
            <TextInput placeholder="Address Line" {...form.getInputProps("addressLine")} radius="md" />
            <SimpleGrid cols={2}>
              <TextInput placeholder="City" {...form.getInputProps("city")} radius="md" />
              <Select placeholder="State" data={US_STATES} {...form.getInputProps("state")} radius="md" />
              <TextInput placeholder="Zip Code" {...form.getInputProps("zipCode")} radius="md" />
              <Select placeholder="Country" data={countries} {...form.getInputProps("country")} radius="md" />
            </SimpleGrid>
          </Stack>
        </Group>

        <Group justify="space-between">
          <Text fw={600}>Coordinates *</Text>
          <Group w={526} grow>
            <NumberInput placeholder="Latitude" {...form.getInputProps("latitude")} hideControls radius="md" />
            <NumberInput placeholder="Longitude" {...form.getInputProps("longitude")} hideControls radius="md" />
          </Group>
        </Group>

        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" color="#053766">Submit</Button>
        </Group>
      </form>
    </Box>
  );
}