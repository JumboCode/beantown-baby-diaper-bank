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
import { fetchCoordsFromAddress } from "@/lib/server/util";

interface EditPartnerFormProps {
  partner: Partner;
  onClose: () => void;
}

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
    .map((p) => p.trim())
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
    .filter((part) => Boolean(part))
    .join(", ");

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

const requiredInput = (label: string) => (value: unknown) => {
  const v = (value === 0 ? "0" : (value ?? "")).toString().trim();
  if (v === "") return `${label} is required`;
  return /.+/.test(v) ? null : `${label} must be filled out`;
};

type UpdatePercentagesOptions = "one-time" | "continuous";


const parseMonthDateForPicker = (
  rawDate: string | null | undefined,
): Date | null => {
  if (!rawDate) return null;
  const monthMatch = rawDate.match(/^(\d{4})-(\d{2})/);
  if (!monthMatch) {
    const parsed = new Date(rawDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const year = Number(monthMatch[1]);
  const monthIndex = Number(monthMatch[2]) - 1;
  return new Date(Date.UTC(year, monthIndex, 1, 12));
};

const formatMonthDateForApi = (date: Date | string | null): string | null => {
  if (!date) return null;

  if (typeof date === "string") {
    const monthMatch = date.match(/^(\d{4})-(\d{2})/);
    if (monthMatch) {
      return `${monthMatch[1]}-${monthMatch[2]}-01`;
    }
  }

  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
};

export default function EditPartnerForm({
  partner,
  onClose,
}: EditPartnerFormProps) {
  const [loading, setLoading] = useState(false);
  const [monthVerificationErrorMsg, setMonthVerificationErrorMsg] = useState<string | null>('');
  const [initialLogoUrl] = useState<string>(partner.logo_url || "");
  const [activePercentTab, setActivePercentTab] =
    useState<UpdatePercentagesOptions>("one-time");
  const [cityPercentages, setCityPercentages] = useState<
    {
      city: { id: number; name: string };
      percentage: number;
    }[]
  >([]);

  useEffect(() => {
    fetch(`/api/partners/percentages?partnerId=${partner.id}`)
      .then((res) => res.json())
      .then((data) => {
        setCityPercentages(data.data);
      })
      .catch((error) => {
        console.error("Error fetching partner percentages:", error);
      });
  }, [partner.id]);

  const initialCityPercentEntries: CityPercentage[] =
    cityPercentages.length > 0
      ? cityPercentages.map((entry, idx) => ({
        id: `${entry.city.name}-${idx}`,
        city: entry.city.name,
        percent: Math.round((entry.percentage ?? 0) * 100),
      }))
      : [];

  const addressFields = parseAddressFields(partner.address);

  const form = useForm({
    mode: "controlled",
    validateInputOnChange: true,
    validateInputOnBlur: true,
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
      updatePercentagesType: "one-time" as UpdatePercentagesOptions,
    },
    validate: {
      organization: requiredInput("Name of Organization"),
      time: (value, values) =>
        values.status === "waitlisted" || value ? null : "Select a start time",
      endTime: (value, values) =>
        values.status === "inactive" && !value ? "Select an end time" : null,
      latitude: requiredNumber("Latitude"),
      longitude: requiredNumber("Longitude"),
      state: (value) => (value ? null : "Select a state"),
      city: requiredInput("City"),
      addressLine: requiredInput("Address Line"),
      zipCode: requiredInteger("Zip Code"),
      country: (value) => (value ? null : "Select a country"),
      status: (value) => (value ? null : "Select a status"),
      description: requiredInput("Description"),
      logoUrl: (value, values) => {
        if (!value.trim() && !values.logoFile) return null;
        return typeof value === "string" ? null : "Enter a valid URL";
      },
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

    const formData = {
      id: partner.id,
      name: values.organization,
      description: values.description,
      start_partner:
        values.status !== "waitlisted"
          ? formatMonthDateForApi(values.time)
          : null,
      end_partner:
        values.status === "inactive"
          ? formatMonthDateForApi(values.endTime)
          : null,
      status: values.status,
      coordinates: {
        lat: Number(values.latitude),
        lng: Number(values.longitude),
      },
      address: buildAddressString(values),
      logo: values.logoUrl,
    };

    const logoAction = values.logoFile
      ? "replace"
      : initialLogoUrl && values.logoUrl.trim() === ""
        ? "remove"
        : "keep";

    try {
      const requestBody = new FormData();
      requestBody.append("partner", JSON.stringify(formData));
      requestBody.append("logoAction", logoAction);
      if (values.logoFile) {
        requestBody.append("file", values.logoFile);
      }

      const response = await fetch("/api/partners", {
        method: "POST",
        body: requestBody,
      });

      if (!response.ok) {
        const err = await response.json();
        form.setFieldError("logoFile", err.error);
        return;
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("partners:refresh"));
      }
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box pos="relative">
      <LoadingOverlay
        visible={loading}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />

      <div className="mx-8">
        <h2 className="text-lg text-gray-500" style={{ marginBottom: "24px" }}>
          Change your partner data
        </h2>
        <form
          onSubmit={form.onSubmit(submitEditPartner)}
          className="flex flex-col gap-5"
        >
          <Group justify="space-between" align="flex-start">
            <Text fw={600} c="#344054">
              Name of Organization <span className="text-red-600">*</span>
            </Text>
            <TextInput
              placeholder="Name"
              {...form.getInputProps("organization")}
              size="md"
              className="min-w-170"
              radius="md"
            />
          </Group>

          <Group justify="space-between" align="flex-start">
            <Text fw={600} c="#344054">
              Description <span className="text-red-600">*</span>
            </Text>
            <Textarea
              {...form.getInputProps("description")}
              size="md"
              className="min-w-170"
              radius="md"
              autosize
              maxRows={6}
            />
          </Group>

          <Group justify="space-between" align="flex-start" w="100%">
            <Text fw={600} c="#344054" className="w-40">
              Status <span className="text-red-600">*</span>
            </Text>

            <Radio.Group
              value={form.values.status}
              onChange={(val) => form.setFieldValue("status", val as status)}
              className="min-w-170 w-full max-w-[600px]"
            >
              <Group gap="md" grow>
                {[
                  {
                    value: "active",
                    title: "Active",
                    description: "Currently active",
                  },
                  {
                    value: "inactive",
                    title: "Inactive",
                    description: "No longer active",
                  },
                  {
                    value: "waitlisted",
                    title: "Waitlisted",
                    description: "On the waitlist",
                  },
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

          {form.values.status !== "waitlisted" && (
            <Group justify="space-between" align="flex-start">
              <Text fw={600} c="#344054">
                Time it started <span className="text-red-600">*</span>
              </Text>
              <MonthPickerInput
                placeholder="Pick date"
                {...form.getInputProps("time")}
                required
                className="min-w-170 w-full max-w-[600px]"
              />
            </Group>
          )}

          {form.values.status === "inactive" && (
            <Group justify="space-between" align="flex-start">
              <Text fw={600} c="#344054">
                Time it ended <span className="text-red-600">*</span>
              </Text>
              <MonthPickerInput
                placeholder="Pick end date"
                {...form.getInputProps("endTime")}
                required
                className="min-w-170 w-full max-w-[600px]"
              />
            </Group>
          )}

          <Group justify="space-between" align="flex-start" w="100%">
            <Text fw={600} c="#344054">
              Address <span className="text-red-600">*</span>
            </Text>
            <Stack className="min-w-170 w-full max-w-[600px]">
              <TextInput
                placeholder="Address Line"
                {...form.getInputProps("addressLine")}
                size="md"
                radius="md"
              />
              <SimpleGrid cols={2}>
                <TextInput
                  placeholder="City"
                  {...form.getInputProps("city")}
                  size="md"
                  radius="md"
                />
                <Select
                  placeholder="State"
                  data={US_STATES}
                  searchable
                  value={form.values.state || null}
                  onChange={(val) => form.setFieldValue("state", val || "")}
                  error={form.errors.state}
                  size="md"
                  radius="md"
                />
                <TextInput
                  placeholder="Zip Code"
                  {...form.getInputProps("zipCode")}
                  size="md"
                  radius="md"
                />
                <Select
                  placeholder="Country"
                  data={countries}
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
            <Text fw={600} c="#344054">
              Coords <span className="text-red-600">*</span>
            </Text>
            <div className="gap-4 flex">
              <NumberInput
                placeholder="Latitude"
                {...form.getInputProps("latitude")}
                size="md"
                className="min-w-83"
                radius="md"
                hideControls
              />
              <NumberInput
                placeholder="Longitude"
                {...form.getInputProps("longitude")}
                size="md"
                className="min-w-83"
                radius="md"
                hideControls
              />
            </div>
          </Group>

          <Group justify="space-between" align="flex-start">
            <Text c="#344054" fw={600}>
              Logo file or link
            </Text>
            <div className="gap-4 flex">
              <FileInput
                accept="image/png,image/jpeg"
                placeholder="Upload image file"
                radius="md"
                clearable
                onChange={(file) => {
                  form.setFieldValue("logoFile", file);
                  if (!file) {
                    form.setFieldValue("logoUrl", "");
                    form.clearFieldError("logoFile");
                  }
                }}
                error={form.errors.logoFile || form.errors.logoUrl}
                className="min-w-83"
              />
              <TextInput
                placeholder="Logo URL"
                key={form.key("logoUrl")}
                {...form.getInputProps("logoUrl")}
                radius="md"
                className="min-w-83"
              />
            </div>
          </Group>

          {form.values.status !== "waitlisted" && (
            <Group justify="space-between" align="flex-start">
              <Stack gap={4} className="w-40">
                <Text fw={600} c="#344054">
                  Update Logic
                </Text>
                <Text size="xs" c="dimmed">Choose how to update percentages</Text>
              </Stack>

              <Stack className="min-w-170 w-full max-w-[600px]" gap="xl">
                <Radio.Group
                  value={activePercentTab}
                  onChange={(val) => {
                    setActivePercentTab(val as UpdatePercentagesOptions);
                    form.setFieldValue("updatePercentagesType", val as UpdatePercentagesOptions);
                  }}
                >
                  <SimpleGrid cols={2} spacing="md">
                    {[
                      {
                        value: "continuous",
                        title: "Continuous Update",
                        description: "Updates ongoing percentages (All future months)",
                        icon: <RiLineChartLine size={22} />,
                      },
                      {
                        value: "one-time",
                        title: "One-Time Update",
                        description: "Updates a specific historical month only",
                        icon: <RiCalendarEventLine size={22} />,
                      },
                    ].map((option) => (
                      <Radio.Card
                        key={option.value}
                        value={option.value}
                        radius="lg"
                        p="md"
                        className={`border transition shadow-sm hover:shadow-md ${
                          activePercentTab === option.value 
                            ? "border-blue-600 bg-blue-50" 
                            : "border-gray-200"
                        }`}
                      >
                        <Group wrap="nowrap" align="flex-start">
                          <Radio.Indicator />
                          <Stack gap={4}>
                            <Group gap="xs">
                              {option.icon}
                              <Text fw={700}>{option.title}</Text>
                            </Group>
                            <Text size="xs" c="dimmed">
                              {option.description}
                            </Text>
                          </Stack>
                        </Group>
                      </Radio.Card>
                    ))}
                  </SimpleGrid>
                </Radio.Group>
                {activePercentTab === "one-time" ? (
                  <OneTimeUpdateForm
                    initialCityPercentages={initialCityPercentEntries}
                    partnerId={`${partner.id}`}
                    dataNotExistErrorMsg={monthVerificationErrorMsg}
                  />
                ) : (
                  <ContinuousUpdateForm
                    partnerId={`${partner.id}`}
                    initialCityPercentages={initialCityPercentEntries}
                  />
                )}
              </Stack>
            </Group>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              color="#053766"
              radius="md"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button variant="filled" color="#053766" radius="md" type="submit">
              Submit
            </Button>
          </Group>
        </form>
      </div>
    </Box>
  );
}
