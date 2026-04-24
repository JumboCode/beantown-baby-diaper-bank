"use client";

import {
  Button,
  Group,
  TextInput,
  Text,
  Textarea,
  NumberInput,
  Radio,
  Select,
  Stack,
  LoadingOverlay,
  SimpleGrid,
  Grid,
} from "@mantine/core";
import LogoDropzone from "./LogoDropzone";
import { useForm } from "@mantine/form";
import { MonthPickerInput } from "@mantine/dates";
import { Partner } from "./PartnerTable";
import { useEffect, useMemo, useRef, useState } from "react";
import { status } from "@/generated/prisma/enums";
import CityPercentagesForm, { type CityPercentage } from "./CityPercentagesForm";
import "@mantine/dates/styles.css";
import { fetchCoordsFromAddress } from "@/lib/util";
import { US_STATES } from "@/lib/types";
import { buildAddressString, usePartnerSubmit } from "@/hooks/admin/usePartnerSubmit";

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
    state: US_STATES.includes(parts[2] || "") ? parts[2] : "",
    zipCode: /^\d{5}(-\d{4})?$/.test(parts[3] || "") ? parts[3] : "",
    country: countries.includes(parts[4] || "") ? parts[4] : DEFAULT_COUNTRY,
  };
};

const requiredNumber = (label: string) => (value: unknown) => {
  const v = (value === 0 ? "0" : (value ?? "")).toString().trim();
  if (v === "") return `${label} is required`;
  return /^-?\d+(\.\d+)?$/.test(v) ? null : `${label} must be a number`;
};

const requiredInput = (label: string) => (value: unknown) => {
  const v = (value === 0 ? "0" : (value ?? "")).toString().trim();
  if (v === "") return `${label} is required`;
  return /.+/.test(v) ? null : `${label} must be filled out`;
};

const parseMonthDateForPicker = (rawDate: string | null | undefined): Date | null => {
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

export default function EditPartnerForm({ partner, onClose }: EditPartnerFormProps) {
  const [initialLogoUrl] = useState<string>(partner.logoUrl || "");
  const [cityEntries, setCityEntries] = useState<CityPercentage[]>([]);
  const [cityPercentages, setCityPercentages] = useState<
    { city: { id: number; name: string }; percentage: number }[]
  >([]);

  useEffect(() => {
    fetch(`/api/partners/percentages?partnerId=${partner.id}`)
      .then((res) => res.json())
      .then((data) => setCityPercentages(data.data))
      .catch((error) => console.error("Error fetching partner percentages:", error));
  }, [partner.id]);

  const initialCityPercentEntries = useMemo<CityPercentage[]>(
    () =>
      cityPercentages.map((entry, idx) => ({
        id: `${entry.city.name}-${idx}`,
        city: entry.city.name,
        percent: Math.round((entry.percentage ?? 0) * 100),
      })),
    [cityPercentages],
  );

  const addressFields = parseAddressFields(partner.address);

  const form = useForm({
    mode: "controlled",
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
      logoUrl: partner.logoUrl || "",
      numBabies: (partner.num_babies ?? "") as number | "",
      cityPercents: initialCityPercentEntries,
    },
    validate: {
      organization: requiredInput("Name of Organization"),
      time: (value, values) =>
        values.status === "waitlisted" || value ? null : "Select a start time",
      endTime: (value, values) => {
        if (values.status === "inactive" && !value) return "Select an end time";
        if (value && values.time && value <= values.time)
          return "End time must be after start time";
        return null;
      },
      latitude: requiredNumber("Latitude"),
      longitude: requiredNumber("Longitude"),
      state: (value) => (value ? null : "Select a state"),
      city: requiredInput("City"),
      addressLine: requiredInput("Address Line"),
      zipCode: (value: string) =>
        /^\d{5}(-\d{4})?$/.test(value.trim())
          ? null
          : "Zip Code must be a valid US zip code (e.g. 02101)",
      country: (value) => (value ? null : "Select a country"),
      status: (value) => (value ? null : "Select a status"),
      description: requiredInput("Description"),
      logoUrl: (value, values) => {
        if (!value.trim() && !values.logoFile) return null;
        return typeof value === "string" ? null : "Enter a valid URL";
      },
      cityPercents: (_, values) => {
        if (values.status === "waitlisted") return null;
        const total = values.cityPercents.reduce(
          (s: number, e: CityPercentage) => s + e.percent,
          0,
        );
        if (values.cityPercents.length === 0) return "Add at least one city";
        return total === 100 ? null : `Percentages must add up to 100% (currently ${total}%)`;
      },
    },
  });

  function handleSubmit(values: typeof form.values) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { cityPercents: _cityPercents, ...rest } = values;
    submit(rest);
  }

  const { submit, isSubmitting, warning } = usePartnerSubmit({
    cityEntries,
    partnerId: partner.id,
    onSuccess: () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("partners:refresh"));
      }
      onClose();
    },
    onFieldError: (field, message) => form.setFieldError(field, message),
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

  return (
    <>
      <LoadingOverlay
        visible={isSubmitting}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Grid pb={80}>
          <Grid.Col span={5}>
            <Text fw={600} c="var(--color-text-heading)" fz={16}>
              Name of Organization <span className="text-red-600">*</span>
            </Text>
          </Grid.Col>
          <Grid.Col span={7}>
            <TextInput
              placeholder="Name"
              {...form.getInputProps("organization")}
              size="md"
              radius="md"
            />
          </Grid.Col>

          <Grid.Col span={5}>
            <Text fw={600} c="var(--color-text-heading)" fz={16}>
              Description <span className="text-red-600">*</span>
            </Text>
          </Grid.Col>
          <Grid.Col span={7}>
            <Textarea
              key={form.key("description")}
              {...form.getInputProps("description")}
              size="md"
              radius="md"
              autosize
              maxRows={6}
            />
          </Grid.Col>

          <Grid.Col span={5}>
            <Text fw={600} c="var(--color-text-heading)" fz={16}>
              Status <span className="text-red-600">*</span>
            </Text>
          </Grid.Col>
          <Grid.Col span={7}>
            <Radio.Group
              value={form.values.status}
              onChange={(val) => form.setFieldValue("status", val as status)}
            >
              <Group gap="md" grow>
                {[
                  { value: "active", title: "Active", description: "Currently active" },
                  { value: "inactive", title: "Inactive", description: "No longer active" },
                  { value: "waitlisted", title: "Waitlisted", description: "On the waitlist" },
                ].map((option) => (
                  <Radio.Card
                    key={option.value}
                    value={option.value}
                    radius="md"
                    p="md"
                    className="border border-gray-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md data-[checked=true]:border-[var(--color-brand)] data-[checked=true]:bg-blue-50 h-full"
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
          </Grid.Col>

          {form.values.status !== "waitlisted" && (
            <>
              <Grid.Col span={5}>
                <Text fw={600} c="var(--color-text-heading)" fz={16}>
                  Time it started <span className="text-red-600">*</span>
                </Text>
              </Grid.Col>
              <Grid.Col span={7}>
                <MonthPickerInput
                  placeholder="Pick date"
                  {...form.getInputProps("time")}
                  onChange={(val) => {
                    form.setFieldValue("time", new Date(val ?? ""));
                    // Re-validate endTime so the cross-field error stays current
                    form.validateField("endTime");
                  }}
                  required
                  size="md"
                />
              </Grid.Col>
            </>
          )}

          {form.values.status === "inactive" && (
            <>
              <Grid.Col span={5}>
                <Text fw={600} c="var(--color-text-heading)" fz={16}>
                  Time it ended <span className="text-red-600">*</span>
                </Text>
              </Grid.Col>
              <Grid.Col span={7}>
                <MonthPickerInput
                  placeholder="Pick end date"
                  {...form.getInputProps("endTime")}
                  minDate={
                    form.values.time
                      ? new Date(form.values.time.getFullYear(), form.values.time.getMonth() + 1, 1)
                      : undefined
                  }
                  required
                  size="md"
                />
              </Grid.Col>
            </>
          )}

          <Grid.Col span={5}>
            <Text fw={600} c="var(--color-text-heading)" fz={16}>
              Address <span className="text-red-600">*</span>
            </Text>
          </Grid.Col>
          <Grid.Col span={7}>
            <Stack>
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
          </Grid.Col>

          <Grid.Col span={5}>
            <Text fw={600} c="var(--color-text-heading)" fz={16}>
              Logo
            </Text>
          </Grid.Col>
          <Grid.Col span={7}>
            <LogoDropzone
              file={form.values.logoFile}
              existingUrl={initialLogoUrl || undefined}
              onChange={(file) => {
                form.setFieldValue("logoFile", file);
                if (!file) form.clearFieldError("logoFile");
              }}
              error={
                form.errors.logoFile
                  ? String(form.errors.logoFile)
                  : form.errors.logoUrl
                    ? String(form.errors.logoUrl)
                    : undefined
              }
            />
          </Grid.Col>

          <Grid.Col span={5}>
            <Text fw={600} c="var(--color-text-heading)" fz={16}>
              Babies Helped Per Month
            </Text>
          </Grid.Col>
          <Grid.Col span={7}>
            <NumberInput
              placeholder="Approximate number (optional)"
              min={0}
              value={form.values.numBabies}
              onChange={(val) =>
                form.setFieldValue("numBabies", typeof val === "number" ? val : "")
              }
              size="md"
              radius="md"
              hideControls
            />
          </Grid.Col>

          {form.values.status !== "waitlisted" && (
            <>
              <Grid.Col span={5}>
                <Text fw={600} c="var(--color-text-heading)" fz={16}>
                  Cities Served <span className="text-red-600">*</span>
                </Text>
              </Grid.Col>
              <Grid.Col span={7}>
                <div>
                  <CityPercentagesForm
                    initialEntries={initialCityPercentEntries}
                    onChange={(entries) => {
                      setCityEntries(entries);
                      form.setFieldValue("cityPercents", entries);
                      if (form.errors.cityPercents) form.validateField("cityPercents");
                    }}
                  />
                  {form.errors.cityPercents && (
                    <Text c="red" size="sm" mt={6}>
                      {form.errors.cityPercents}
                    </Text>
                  )}
                </div>
              </Grid.Col>
            </>
          )}

          {warning && (
            <Grid.Col span={12}>
              <Text c="red" size="sm">
                {warning}
              </Text>
            </Grid.Col>
          )}
        </Grid>

        <Group
          justify="flex-end"
          style={{
            position: "sticky",
            bottom: 0,
            backgroundColor: "white",
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 32,
            paddingRight: 32,
            borderTop: "1px solid var(--mantine-color-gray-1)",
            zIndex: 10,
            margin: "auto -32px -32px -32px",
          }}
        >
          <Button variant="outline" color="brand" radius="md" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="filled" color="brand" radius="md" type="submit" loading={isSubmitting}>
            Submit
          </Button>
        </Group>
      </form>
    </>
  );
}
