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
  Modal,
  Stack,
  SimpleGrid,
  LoadingOverlay,
  Grid,
} from "@mantine/core";
import LogoDropzone from "./LogoDropzone";
import { useForm } from "@mantine/form";
import { MonthPickerInput } from "@mantine/dates";
import { useEffect, useRef, useState } from "react";
import { fetchCoordsFromAddress } from "@/lib/util";
import CityPercentagesForm, { CityPercentage } from "./CityPercentagesForm";
import { US_STATES } from "@/lib/types";
import { buildAddressString, usePartnerSubmit } from "@/hooks/admin/usePartnerSubmit";
import "@mantine/dates/styles.css";

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
      status: "active",
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
      cityPercents: [] as CityPercentage[],
    },

    validate: {
      organization: (value) =>
        typeof value === "string" && value.trim() ? null : "Organization name is required",
      description: (value) =>
        typeof value === "string" && value.trim() ? null : "Description is required",
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

  const { submit, isSubmitting } = usePartnerSubmit({
    cityEntries,
    onSuccess: () => {
      form.reset();
      form.setFieldValue("country", DEFAULT_COUNTRY);
      form.setFieldValue("cityPercents", []);
      setCityEntries([]);
      window.dispatchEvent(new CustomEvent("partners:refresh"));
      onClose();
    },
    onFieldError: (field, message) => form.setFieldError(field, message),
  });

  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  function handleSubmit(values: typeof form.values) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { cityPercents: _cityPercents, ...rest } = values;
    submit(rest);
  }

  function handleSubmitError(errors: typeof form.errors) {
    const firstKey = Object.keys(errors)[0];
    if (firstKey && fieldRefs.current[firstKey]) {
      fieldRefs.current[firstKey]!.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

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
    <Modal opened={opened} onClose={onClose} title="Add New Partner">
      <LoadingOverlay
        visible={isSubmitting}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />

      <form onSubmit={form.onSubmit(handleSubmit, handleSubmitError)}>
        <Grid pb={80} pt={2}>
          <Grid.Col span={5}>
            <Text c="var(--color-text-heading)" fz={16} fw={600}>
              Status <span className="text-red-600">*</span>
            </Text>
          </Grid.Col>

          <Grid.Col span={7}>
            <Radio.Group
              value={form.values.status}
              onChange={(val) => form.setFieldValue("status", val)}
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
                    className="border border-gray-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md data-[checked=true]:border-brand] data-[checked=true]:bg-blue-50 h-full"
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
            </Radio.Group>
          </Grid.Col>

          <Grid.Col span={5}>
            <Text c="var(--color-text-heading)" fz={16} fw={600}>
              Name of Organization <span className="text-red-600">*</span>
            </Text>
          </Grid.Col>

          <Grid.Col span={7}>
            <TextInput
              placeholder="Name"
              key={form.key("organization")}
              {...form.getInputProps("organization")}
              size="md"
              radius="md"
              required
            />
          </Grid.Col>

          <Grid.Col span={5}>
            <Text c="var(--color-text-heading)" fz={16} fw={600}>
              Description <span className="text-red-600">*</span>
            </Text>
          </Grid.Col>

          <Grid.Col span={7}>
            <Textarea
              placeholder="Description"
              key={form.key("description")}
              {...form.getInputProps("description")}
              size="md"
              required
              autosize
              maxRows={6}
            />
          </Grid.Col>

          {form.values.status !== "waitlisted" && (
            <>
              <Grid.Col span={5}>
                <Text c="var(--color-text-heading)" fz={16} fw={600}>
                  Cities Served <span className="text-red-600">*</span>
                </Text>
              </Grid.Col>

              <Grid.Col span={7}>
                <div
                  ref={(el) => {
                    fieldRefs.current.cityPercents = el;
                  }}
                >
                  <CityPercentagesForm
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

          {form.values.status !== "waitlisted" && (
            <>
              <Grid.Col span={5}>
                <Text c="var(--color-text-heading)" fz={16} fw={600}>
                  Time it started <span className="text-red-600">*</span>
                </Text>
              </Grid.Col>

              <Grid.Col span={7}>
                <MonthPickerInput
                  placeholder="Pick date"
                  value={form.values.time}
                  onChange={(val) => form.setFieldValue("time", val as Date | null)}
                  error={form.errors.time}
                  required
                  size="md"
                />
              </Grid.Col>
            </>
          )}

          <Grid.Col span={5}>
            <Text c="var(--color-text-heading)" fz={16} fw={600}>
              Address <span className="text-red-600">*</span>
            </Text>
          </Grid.Col>
          <Grid.Col span={7}>
            <Stack style={{ flex: 1 }}>
              <TextInput
                placeholder="Address Line"
                key={form.key("addressLine")}
                {...form.getInputProps("addressLine")}
                size="md"
                radius="md"
                required
              />
              <SimpleGrid cols={2}>
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
          </Grid.Col>

          <Grid.Col span={5}>
            <Text c="var(--color-text-heading)" fz={16} fw={600}>
              Logo
            </Text>
          </Grid.Col>
          <Grid.Col span={7}>
            <div style={{ flex: 1 }}>
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
          </Grid.Col>
          <Grid.Col span={5}>
            <Text c="var(--color-text-heading)" fz={16} fw={600}>
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
          <Button
            variant="outline"
            color="brand"
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
            color="brand"
            radius="md"
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Submit
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
