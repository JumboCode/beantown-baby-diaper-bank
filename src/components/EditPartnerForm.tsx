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
import "@mantine/dates/styles.css";
import { Partner } from "./admin/PartnerTable";
import parser from "parse-address";
import { useState } from "react";
import { status } from "@/generated/prisma/enums";
import OneTimeUpdateForm from "./OneTimeUpdateForm";
import ContinuousUpdateForm from "./ContinuousUpdateForm";

interface EditPartnerFormProps {
  partner: Partner;
  onClose: () => void;
}

const countries = ["United States", "Canada"];

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

interface RequiredAddressComponents {
  number: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

type UpdatePercentagesOptions = "one-time" | "continuous";

type AddressWithExtras = RequiredAddressComponents &
  Partial<parser.ParsedLocation>;

function parseAddress(fullAddress: string | null): AddressWithExtras {
  const defaults = {
    number: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  };

  if (!fullAddress) return defaults;

  try {
    const parsed = parser.parseAddress(fullAddress) ?? {};
    return { ...defaults, ...parsed };
  } catch (error) {
    console.error("Error parsing address:", error);
    return defaults;
  }
}
function formatAddress(address: AddressWithExtras) {
  try {
    const parts = [];
    if (address.number) parts.push(address.number);
    if (address.prefix) parts.push(address.prefix);
    if (address.street) parts.push(address.street);
    if (address.type) parts.push(address.type);
    if (address.suffix) parts.push(address.suffix);
    return parts.join(" ");
  } catch (error) {
    console.error("Error formatting address:", error);
    return "";
  }
}
export default function EditPartnerForm({
  partner,
  onClose,
}: EditPartnerFormProps) {
  const [loading, setLoading] = useState(false);
  const [activePercentTab, setActivePercentTab] =
    useState<UpdatePercentagesOptions>("one-time");

  console.log("Editing partner:", partner);

  const address = parseAddress(partner.address);

  const form = useForm({
    mode: "controlled",
    validateInputOnChange: true,
    validateInputOnBlur: true,
    initialValues: {
      organization: partner.name,
      description: partner.description || "",
      time: partner.start_partner || "",
      status: partner.status,
      latitude: partner.coords ? partner.coords.lat : "",
      longitude: partner.coords ? partner.coords.lng : "",
      addressLine: formatAddress(address),
      city: address.city || "",
      state: address.state || "",
      zipCode: address.zip || "",
      country: "United States",
      logoFile: null as File | null,
      logoUrl: partner.logo_url || "",
      updatePercentagesType: "one-time" as UpdatePercentagesOptions,
    },
    validate: {
      organization: (value) =>
        typeof value === "string" ? null : "Organization name must be a string",
      time: (value) => (value.length > 0 ? null : "Select a start time"),
      latitude: requiredNumber("Latitude"),
      longitude: requiredNumber("Longitude"),
      state: (value) =>
        typeof value === "string" ? null : "State name must be a string",
      zipCode: requiredInteger("Zip Code"),
      country: (value) => (value ? null : "Select a country"),
      status: (value) => (value ? null : "Select a status"),

      logoUrl: (value, values) => {
        if (!value.trim() && !values.logoFile) return; // logos are optional according to the figma?
        return typeof value === "string" ? null : "Enter a valid URL";
      },
    },
  });

  async function submitEditPartner(values: typeof form.values) {
    setLoading(true);
    console.log("Submitting edited partner values:", values);
    const formData = {
      id: partner.id,
      name: values.organization,
      description: values.description,
      start_partner: new Date(values.time).toISOString(),
      status: values.status,
      coordinates: {
        lat: values.latitude,
        lng: values.longitude,
      },
      address:
        values.addressLine +
        ", " +
        values.city +
        ", " +
        values.state +
        ", " +
        " " +
        values.zipCode,
      logo: values.logoUrl,
    };

    const response = await fetch("/api/partners", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Failed to update partner data", err);
      setLoading(false);
      return;
    }
    setLoading(false);
    onClose();
  }

  return (
    <Box pos="relative">
      <LoadingOverlay
        visible={loading}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <h2 className="text-lg text-gray-500">Change your partner data</h2>

      <div className="p-4 border border-gray-300 rounded-xl">
        <form
          onSubmit={form.onSubmit((values) => {
            submitEditPartner(values);
          })}
          className="flex flex-col gap-5">
          {/* Name of Organization */}
          <Group
            justify="space-between"
            align="flex-start">
            <Text fw={600}>
              Name of Organzation <span className="text-red-600">*</span>
            </Text>
            <TextInput
              placeholder="Name"
              key={form.key("organization")}
              {...form.getInputProps("organization")}
              size="md"
              className="min-w-170"
              radius="md"
              required
            />
          </Group>

          {/* Description */}
          <Group
            justify="space-between"
            align="flex-start">
            <Text fw={600}>
              Description <span className="text-red-600">*</span>
            </Text>
            <Textarea
              key={form.key("description")}
              {...form.getInputProps("description")}
              size="md"
              className="min-w-170"
              radius="md"
              required
            />
          </Group>

          {/* Time Started*/}
          <Group
            justify="space-between"
            align="flex-start">
            <Text fw={600}>
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

          <Group
            justify="space-between"
            align="flex-start"
            w="100%">
            <Text
              fw={600}
              className="w-40">
              Status <span className="text-red-600">*</span>
            </Text>

            <Radio.Group
              value={form.values.status}
              onChange={(val) => form.setFieldValue("status", val as status)}
              className="min-w-170 w-full max-w-[600px]">
              <Group
                gap="md"
                grow>
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
                    className="border border-gray-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md data-[checked=true]:border-[#053766] data-[checked=true]:bg-blue-50 h-full">
                    <Group
                      wrap="nowrap"
                      align="flex-start"
                      gap="sm">
                      <Radio.Indicator />
                      <Stack gap={4}>
                        <Text fw={700}>{option.title}</Text>
                        <Text
                          size="xs"
                          c="dimmed">
                          {option.description}
                        </Text>
                      </Stack>
                    </Group>
                  </Radio.Card>
                ))}
              </Group>

              {form.errors.status && (
                <Text
                  c="red"
                  size="sm">
                  {form.errors.status}
                </Text>
              )}
            </Radio.Group>
          </Group>

          {/* Latitude and Longitude */}
          <Group
            justify="space-between"
            align="flex-start">
            <Text fw={600}>
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
          <Group
            justify="space-between"
            align="flex-start"
            w="100%">
            <Text fw={600}>
              Address <span className="text-red-600">*</span>
            </Text>

            <div className="flex flex-col gap-4 min-w-170 w-full max-w-[600px]">
              <TextInput
                placeholder="Address Line"
                key={form.key("addressLine")}
                {...form.getInputProps("addressLine")}
                size="md"
                radius="md"
                required
              />

              <div className="flex gap-4 w-full">
                <TextInput
                  placeholder="City"
                  key={form.key("city")}
                  {...form.getInputProps("city")}
                  size="md"
                  className="flex-1"
                  radius="md"
                  required
                />
                <TextInput
                  placeholder="State"
                  key={form.key("state")}
                  {...form.getInputProps("state")}
                  size="md"
                  className="w-[120px]"
                  radius="md"
                  required
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
          <Group
            justify="space-between"
            align="flex-start">
            <Text fw={600}>Logo file or link</Text>
            <div className="gap-4 flex">
              <FileInput
                accept="image/png,image/jpeg"
                placeholder="Upload image file"
                radius="md"
                clearable
                onChange={(file) => form.setFieldValue("logoFile", file)}
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
          <Group
            justify="space-between"
            align="flex-start"
            w="100%">
            <Text fw={600}>Update City Distribution Percentages</Text>
            <Tabs
              value={activePercentTab}
              onChange={(val) => {
                if (!val) return;
                setActivePercentTab(val as UpdatePercentagesOptions);
                form.setFieldValue(
                  "updatePercentagesType",
                  val as UpdatePercentagesOptions
                );
              }}
              className="min-w-170 w-full max-w-[600px]">
              <Tabs.List
                grow
                mb="xl">
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
                    className="px-0">
                    {(() => {
                      const isActive = activePercentTab === option.value;
                      return (
                        <div
                          className={`rounded-xl shadow-sm transition hover:-translate-y-0.5 hover:shadow-md h-full border ${
                            isActive
                              ? "border-[#1D3A8A] bg-[#EEF2FF]"
                              : "border-gray-300 bg-white"
                          }`}
                          style={{ borderWidth: isActive ? 2 : 1 }}>
                          <Stack
                            gap="xs"
                            align="center"
                            p="md">
                            <div
                              className={`${
                                isActive ? "text-[#1D3A8A]" : "text-gray-500"
                              } opacity-80`}>
                              {option.icon}
                            </div>
                            <Text
                              fw={700}
                              size="md"
                              className={isActive ? "text-[#1D3A8A]" : ""}>
                              {option.title}
                            </Text>
                            <Text
                              size="sm"
                              c={isActive ? "gray.6" : "dimmed"}
                              ta="center">
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
                <OneTimeUpdateForm />
              </Tabs.Panel>
              <Tabs.Panel value="continuous">
                <ContinuousUpdateForm />
              </Tabs.Panel>
            </Tabs>
          </Group>

          {/* Submit and Cancel Buttons */}
          <Group
            justify="flex-end"
            mt="md">
            <Button
              variant="outline"
              color="#053766"
              radius="md"
              type="button"
              onClick={() => {
                form.reset();
              }}>
              Cancel
            </Button>
            <Button
              variant="filled"
              color="#053766"
              radius="md"
              type="submit">
              Submit
            </Button>
          </Group>
        </form>
      </div>
    </Box>
  );
}
