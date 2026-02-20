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
} from "@mantine/core";
import { RiCalendarEventLine, RiLineChartLine } from "react-icons/ri";
import { useForm } from "@mantine/form";
import { MonthPickerInput } from "@mantine/dates";
import { Partner } from "./PartnerTable";
import { useEffect, useState } from "react";
import { status } from "@/generated/prisma/enums";
import OneTimeUpdateForm from "./OneTimeUpdateForm";
import ContinuousUpdateForm from "./ContinuousUpdateForm";
import type { CityPercentage } from "./CityPercentagesForm";
import "@mantine/dates/styles.css";

interface EditPartnerFormProps {
  partner: Partner;
  onClose: () => void;
}

const countries = ["United States", "Canada"];
const DEFAULT_COUNTRY = "United States";

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

// Checks if input is a number (can be decimal)
const requiredNumber = (label: string) => (value: unknown) => {
  const v = (value === 0 ? "0" : (value ?? "")).toString().trim();
  if (v === "") return `${label} is required`;
  return /^-?\d+(\.\d+)?$/.test(v) ? null : `${label} must be a number`;
};
// Checks if input is an integer
const requiredInteger = (label: string) => (value: unknown) => {
  const v = (value === 0 ? "0" : (value ?? "")).toString().trim();
  if (v === "") return `${label} is required`;
  return /^\d+$/.test(v) ? null : `${label} must be a number`;
};

//Checks if input is #VALID
const requiredInput = (label: string) => (value: unknown) => {
  const v = (value === 0 ? "0" : (value ?? "")).toString().trim();
  if (v === "") return `${label} is required`;
  return /.+/.test(v) ? null : `${label} must be filled out`;
};

const requiredState = (label: string) => (value: unknown) => {
  const v = (value === 0 ? "0" : (value ?? "")).toString().trim();
  if (v === "") return `${label} is required`;
  return /.*\D.*/.test(v) ? null : `${label} must be filled out`;
};

type UpdatePercentagesOptions = "one-time" | "continuous";
export default function EditPartnerForm({
  partner,
  onClose,
}: EditPartnerFormProps) {
  console.log("partner data:", partner);
  const [loading, setLoading] = useState(false);
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
      time: partner.start_partner ? new Date(partner.start_partner) : null,
      status: partner.status,
      latitude: partner.coords ? partner.coords.lat : "",
      longitude: partner.coords ? partner.coords.lng : "",
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
      time: (value) => (value ? null : "Select a start time"),
      latitude: requiredNumber("Latitude"),
      longitude: requiredNumber("Longitude"),
      state: requiredState("State"),
      city: requiredInput("City"),
      addressLine: requiredInput("Address Line"),
      zipCode: requiredInteger("Zip Code"),
      country: (value) => (value ? null : "Select a country"),
      status: (value) => (value ? null : "Select a status"),
      description: requiredInput("Description"),

      logoUrl: (value, values) => {
        if (!value.trim() && !values.logoFile) return; // logos are optional according to the figma?
        return typeof value === "string" ? null : "Enter a valid URL";
      },
    },
  });

  async function submitEditPartner(values: typeof form.values) {
    setLoading(true);
    const partnerPayload = {
      id: partner.id,
      name: values.organization,
      description: values.description,
      start_partner: values.time
        ? new Date(values.time).toISOString().slice(0, 7)
        : null,
      status: values.status,
      coordinates: {
        lat: values.latitude,
        lng: values.longitude,
      },
      address: buildAddressString({
        addressLine: values.addressLine,
        city: values.city,
        state: values.state,
        zipCode: values.zipCode,
        country: values.country,
      }),
      logo: values.logoUrl,
    };
    const logoAction =
      values.logoFile
        ? "replace"
        : initialLogoUrl && values.logoUrl.trim() === ""
          ? "remove"
          : "keep";

    try {
      const requestBody = new FormData();
      requestBody.append("partner", JSON.stringify(partnerPayload));
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
          onSubmit={form.onSubmit((values) => {
            submitEditPartner(values);
          })}
          className="flex flex-col gap-5"
        >
          {/* Name of Organization */}
          <Group justify="space-between" align="flex-start">
            <Text fw={600} c="#344054">
              Name of Organization <span className="text-red-600">*</span>
            </Text>
            <TextInput
              placeholder="Name"
              key={form.key("organization")}
              {...form.getInputProps("organization")}
              size="md"
              className="min-w-170"
              radius="md"
            />
          </Group>

          {/* Description */}
          <Group justify="space-between" align="flex-start">
            <Text fw={600} c="#344054">
              Description <span className="text-red-600">*</span>
            </Text>
            <Textarea
              key={form.key("description")}
              {...form.getInputProps("description")}
              size="md"
              className="min-w-170"
              radius="md"
              autosize
              maxRows={6}
            />
          </Group>

          {/* Time Started*/}
          <Group justify="space-between" align="flex-start">
            <Text fw={600} c="#344054">
              Time it started <span className="text-red-600">*</span>
            </Text>
            <MonthPickerInput
              placeholder="Pick date"
              key={form.key("time")}
              {...form.getInputProps("time")}
              required
              className="min-w-170"
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
                    description: "Partner is currently active",
                  },
                  {
                    value: "inactive",
                    title: "Inactive",
                    description: "Partner no longer active",
                  },
                  {
                    value: "waitlisted",
                    title: "Waitlisted",
                    description: "Partner is on the waitlist",
                  },
                ].map((option) => (
                  <Radio.Card
                    key={form.key(`status-${option.value}`)}
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
                <Text c="red" size="sm">
                  {form.errors.status}
                </Text>
              )}
            </Radio.Group>
          </Group>

          {/* Latitude and Longitude */}
          <Group justify="space-between" align="flex-start">
            <Text fw={600} c="#344054">
              Coords <span className="text-red-600">*</span>
            </Text>
            <div className="gap-4 flex">
              <NumberInput
                placeholder="Latitude"
                key={form.key("latitude")}
                {...form.getInputProps("latitude")}
                error={form.errors.latitude}
                size="md"
                className="min-w-83"
                radius="md"
                hideControls
              />
              <NumberInput
                placeholder="Longitude"
                key={form.key("longitude")}
                {...form.getInputProps("longitude")}
                error={form.errors.longitude}
                size="md"
                className="min-w-83"
                radius="md"
                hideControls
              />
            </div>
          </Group>

          {/* Address */}
          <Group justify="space-between" align="flex-start" w="100%">
            <Text fw={600} c="#344054">
              Address <span className="text-red-600">*</span>
            </Text>

            <div className="flex flex-col gap-4 min-w-170 w-full max-w-[600px]">
              <TextInput
                placeholder="Address Line"
                key={form.key("addressLine")}
                {...form.getInputProps("addressLine")}
                size="md"
                radius="md"
              />

              <div className="flex gap-4 w-full">
                <TextInput
                  placeholder="City"
                  key={form.key("city")}
                  {...form.getInputProps("city")}
                  size="md"
                  className="flex-1"
                  radius="md"
                />
                <TextInput
                  placeholder="State"
                  key={form.key("state")}
                  {...form.getInputProps("state")}
                  size="md"
                  className="w-[120px]"
                  radius="md"
                />
              </div>

              <div className="flex gap-4 w-full">
                <TextInput
                  placeholder="Zip Code"
                  {...form.getInputProps("zipCode")}
                  key={form.key("zipCode")}
                  value={form.values.zipCode}
                  onChange={(val) =>
                    form.setFieldValue("zipCode", val.target.value)
                  }
                  error={form.errors.zipCode}
                  size="md"
                  className="w-[120px]"
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
                  className="flex-1"
                  radius="md"
                />
              </div>
            </div>
          </Group>

          {/* Logo File Upload */}
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
                  }
                  if (!file) {
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

          {/* Update Percentages */}
          <Group justify="space-between" align="flex-start">
            <Text fw={600} c="#344054">
              City Distribution Percentages
            </Text>

            <Tabs
              value={activePercentTab}
              onChange={(val) => {
                if (!val) return;
                setActivePercentTab(val as UpdatePercentagesOptions);
                form.setFieldValue(
                  "updatePercentagesType",
                  val as UpdatePercentagesOptions,
                );
              }}
              className="min-w-170 w-full max-w-[600px]"
            >
              <Tabs.List grow mb="xl">
                {[
                  {
                    value: "one-time",
                    title: "One-Time Update",
                    description: "Update a specific month only",
                    icon: <RiCalendarEventLine size={22} />,
                  },
                  {
                    value: "continuous",
                    title: "Continuous Update",
                    description: "Apply to all future distributions",
                    icon: <RiLineChartLine size={22} />,
                  },
                ].map((option) => (
                  <Tabs.Tab
                    key={option.value}
                    value={option.value}
                    className="px-0"
                  >
                    {(() => {
                      const isActive = activePercentTab === option.value;
                      return (
                        <div
                          className={`rounded-xl shadow-sm transition hover:-translate-y-0.5 hover:shadow-md h-full border ${
                            isActive
                              ? "border-[#1D3A8A] bg-[#EEF2FF]"
                              : "border-gray-300 bg-white"
                          }`}
                          style={{ borderWidth: isActive ? 2 : 1 }}
                        >
                          <Stack gap="xs" align="center" p="md">
                            <div
                              className={`${
                                isActive ? "text-[#1D3A8A]" : "text-gray-500"
                              } opacity-80`}
                            >
                              {option.icon}
                            </div>
                            <Text
                              fw={700}
                              size="md"
                              className={isActive ? "text-[#1D3A8A]" : ""}
                            >
                              {option.title}
                            </Text>
                            <Text
                              size="sm"
                              c={isActive ? "gray.6" : "dimmed"}
                              ta="center"
                            >
                              {option.description}
                            </Text>
                          </Stack>
                        </div>
                      );
                    })()}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
              <Tabs.Panel value="one-time">
                <OneTimeUpdateForm
                  initialCityPercentages={initialCityPercentEntries}
                />
              </Tabs.Panel>
              <Tabs.Panel value="continuous">
                <ContinuousUpdateForm
                  initialCityPercentages={initialCityPercentEntries}
                />
              </Tabs.Panel>
            </Tabs>
          </Group>

          {/* Submit and Cancel Buttons */}
          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              color="#053766"
              radius="md"
              type="button"
              onClick={() => {
                form.reset();
                onClose();
              }}
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
