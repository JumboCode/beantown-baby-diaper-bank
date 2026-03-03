"use client";

import {
  Button,
  Group,
  TextInput,
  ComboboxItem,
  Text,
  TagsInput,
  Textarea,
  Table,
  NumberInput,
  Radio,
  FileInput,
  Select,
  Modal,
  Title,
  Stack,
  SimpleGrid,
  Box,
  LoadingOverlay,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { MonthPickerInput } from "@mantine/dates";
import { useState, useEffect } from "react";
import "@mantine/dates/styles.css";

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
}
// Checks if input is an integer
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
  const [percentages, setPercentages] = useState<Record<string, number>>({});
  const [citiesAPI, setCitiesAPI] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [submitWarning, setSubmitWarning] = useState<string>("");

  useEffect(() => {
    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const res = await fetch(
          "https://secure.geonames.org/searchJSON?q=&adminCode1=MA&country=US&featureClass=P&username=jumbocodebbdb",
        );
        const data = await res.json();

        if (data.geonames) {
          const cityNames = data.geonames.map(
            (city: { name: string }) => city.name,
          );
          const cityUniqueSorted = Array.from(new Set(cityNames)).sort();
          setCitiesAPI(cityUniqueSorted as string[]);
        }
      } catch (err) {
        console.log(`Failed to fetch cities: ${err}`);
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  const form = useForm({
    mode: "controlled",
    validateInputOnChange: true,
    validateInputOnBlur: true,
    initialValues: {
      organization: "",
      description: "",
      time: null as string | null,
      cities: [] as string[],
      status: "",
      latitude: "",
      longitude: "",
      addressLine: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      logoFile: null as File | null,
      logoUrl: "",
    },
    validate: {
      organization: (value) =>
        typeof value === "string" ? null : "Organization name must be a string",
      time: (value, values) => {
        if (values.status === "waitlisted") return null;
        return value ? null : "Select a start time";
      },
      cities: (value, values) => {
        if (value.length === 0) return "Pick at least one city";
        console.log(values.status);
        if (values.status && values.status !== "waitlisted") {
          const total = value.reduce((sum, city) => {
            return sum + (percentages[city] || 0);
          }, 0);
          const roundedTotal = Math.round(total * 100) / 100;
          if (Math.abs(roundedTotal - 100) > 0.01) {
            return `Percentages must add up to 100% (currently ${roundedTotal.toFixed(2)}%)`;
          }
        }
        return null;
      },
      latitude: requiredNumber("Latitude"),
      longitude: requiredNumber("Longitude"),
      state: (value) => (value ? null : "Select a state"),
      zipCode: requiredInteger("Zip Code"),
      country: (value) => (value ? null : "Select a country"),
      status: (value) => (value ? null : "Select a status"),
      // logoFile: (_value, values) =>
      //   !values.logoFile && !values.logoUrl.trim()
      //     ? "Provide a file or a link"
      //     : null,
      //
      // logos are optional according to the figma?
      logoUrl: (value, values) => {
        if (!value.trim() && !values.logoFile) return;
        return typeof value === "string" ? null : "Enter a valid URL";
      },
    },
  });

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
    const cityPercentages = values.cities.map((city) => {
      const raw = Number(percentages[city] ?? 0);
      // rounds percentages to avoid floating-point errors
      const normalized = Number.isFinite(raw)
        ? Number((raw / 100).toFixed(4))
        : 0;
      return { city, percentage: normalized };
    });

    const partnerPayload = {
      name: values.organization,
      description: values.description,
      start_partner: values.time,
      status: values.status,
      coordinates: {
        lat: Number(values.latitude),
        lng: Number(values.longitude),
      },
      address: buildAddressString({
        addressLine: values.addressLine,
        city: values.city,
        state: values.state,
        zipCode: values.zipCode,
        country: values.country,
      }),
      logo: values.logoUrl || "",
      cities: cityPercentages,
    };

    try {
      const requestBody = new FormData();
      requestBody.append("partner", JSON.stringify(partnerPayload));
      /* replace = upload file to storage, keep = don't upload */
      requestBody.append("logoAction", values.logoFile ? "replace" : "keep");
      if (values.logoFile) {
        requestBody.append("file", values.logoFile);
      }

      const response = await fetch("/api/partners", {
        method: "PUT",
        body: requestBody,
      });

      if (!response.ok) {
        const err = await response.json();
        const warning = typeof err?.error === "string" ? err.error : "Unable to submit partner.";
        if (response.status === 422 || warning === "Please check the entered cities.") {
          const cityWarning = "Please check the entered cities.";
          console.error("City geodata validation failed:", err);
          form.setFieldError("cities", cityWarning);
          setSubmitWarning(cityWarning);
          return;
        }
        form.setFieldError("logoFile", warning);
        setSubmitWarning(warning);
        return;
      }

      form.reset();
      setPercentages({});
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
      <Title order={2} c="#667085" fw="normal" fz={18} mb={"md"}>
        Add your new partner data
      </Title>
      <LoadingOverlay
        visible={isSubmitting}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />

      <form
        onSubmit={form.onSubmit((values) => {
          submitPartner(values);
        })}
      >
        <Stack>
          {/* Status */}
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
                        <Text size="xs" c="dimmed">{option.description}</Text>
                      </Stack>
                    </Group>
                  </Radio.Card>
                ))}
              </Group>
              {form.errors.status && <Text c="red" size="sm" mt="xs">{form.errors.status}</Text>}
            </Radio.Group>
          </Group>

          {/* Name of Organization */}
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

          {/* Description */}
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

          {/* Cities Served */}
          <Group align="right" justify="space-between">
            {/* Selected Cities MultiSelect */}
            <Text c="#344054" fz={16} fw={600}>
              Cities Served <span className="text-red-600">*</span>
            </Text>
            <TagsInput
              placeholder={
                isLoadingCities ? "Loading cities..." : "Select cities"
              }
              data={citiesAPI}
              filter={({ options, search }) => {
                const splittedSearch = search.toLowerCase().trim().split(" ");
                return (options as ComboboxItem[]).filter((option) => {
                  const words = option.label.toLowerCase().trim().split(" ");
                  return splittedSearch.every((searchWord) =>
                    words.some((word: string) => word.includes(searchWord)),
                  );
                });
              }}
              disabled={isLoadingCities}
              key={form.key("cities")}
              value={form.values.cities}
              onChange={(values) => {
                form.setFieldValue("cities", values);
                setPercentages((prev) =>
                  values.reduce(
                    (acc, city) => {
                      acc[city] = prev[city] ?? 0;
                      return acc;
                    },
                    {} as Record<string, number>,
                  ),
                );
              }}
              error={form.errors.cities}
              styles={{
                input: form.errors.cities
                  ? { borderColor: "var(--mantine-color-red-6)" }
                  : undefined,
              }}
              size="md"
              w={526}
              radius="md"
            />
          </Group>

          {/* Selected Cities Table with Percentages, sorry this looks digusting */}
          <Group w={526} ml="auto" justify="flex-end">
            {/* Selected Cities Table */}
            {form.values.cities.length > 0 && form.values.status !== "waitlisted" && (
              <>
                <Table w="100%" striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Cities</Table.Th>
                      <Table.Th>Percentage</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {form.values.cities.map((city) => (
                      <Table.Tr key={city}>
                        <Table.Td>{city}</Table.Td>
                        <Table.Td>
                          <NumberInput
                            placeholder="Enter %"
                            min={0}
                            max={100}
                            suffix="%"
                            value={percentages[city] || ""}
                            onChange={(value) => {
                              let res = 0;
                              /* decimal percentages can have up to 2 decimal places */
                              if (typeof value === "number") {
                                res = value;
                                const decimalPart = value
                                  .toString()
                                  .split(".")[1];
                                if (decimalPart && decimalPart.length > 2) {
                                  res = Math.round(value * 100) / 100;
                                }
                              }
                              setPercentages((prev) => ({
                                ...prev,
                                [city]: res,
                              }));
                            }}
                          />
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </>
            )}
          </Group>

          {/* Time Started*/}
            {form.values.status !== "waitlisted" && (
            <Group justify="space-between" align="flex-start">
            <Text c="#344054" fz={16} fw={600}>
              Time it started <span className="text-red-600">*</span>
            </Text>
            <MonthPickerInput
              placeholder="Pick date"
              value={form.values.time}
              onChange={(val) => form.setFieldValue("time", val)}
              error={form.errors.time}
              required
              w={526}
            />
          </Group>
          )}

          {/* Latitude and Longitude */}
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

          {/* Address */}
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
                  onChange={(event) =>
                    form.setFieldValue("zipCode", event.currentTarget.value)
                  }
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
                  onChange={(val) => {
                    form.setFieldValue("country", val || "");
                  }}
                  error={form.errors.country}
                  size="md"
                  radius="md"
                />
              </SimpleGrid>
            </Stack>
          </Group>

          {/* Logo File Upload */}
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

          {/* Submit and Cancel Buttons */}
          {submitWarning ? (
            <Group justify="flex-end" mt="xs">
              <Text c="red" size="sm">
                {submitWarning}
              </Text>
            </Group>
          ) : null}
          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              color="#053766"
              radius="md"
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                form.reset();
                setPercentages({});
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
              disabled={isUploadingFile}
            >
              Submit
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
