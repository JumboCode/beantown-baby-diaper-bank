import {
  Button,
  Group,
  TextInput,
  MultiSelect,
  Text,
  Textarea,
  Table,
  NumberInput,
  Radio,
  FileInput,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { MonthPickerInput } from "@mantine/dates";
import { useState } from "react";
import "@mantine/dates/styles.css";

type Partner = {
  id: number;
  created_at: string;
  name: string;
  description: string | null;
  start_partner: string | null;
  waitlisted: boolean;
  address: string | null;
  coords: { lat: number; lng: number } | null;
  logo_url: string | null;
};

interface EditPartnerFormProps {
  partner: Partner,
  onClose: () => void
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

export default function EditPartnerForm({ partner, onClose }: EditPartnerFormProps) {

  if (!partner) {
    return null;
  }

  function parseAddress(fullAddress: String) {

    // currently, this assumes that all of the addresses are in the form "addressLine, city, state zipcode, country"
    // which is how the add partner form adds addresses to the database
    const parts = fullAddress.split(",").map(s => s.trim());

    const addressLine = parts[0];
    const city = parts[1];
    let state = "";
    let zipCode = "";
    let country = "";


    if (parts.length == 3) {
      const stateZip = parts[2].split(/\s+/);
      state = stateZip[0];
      zipCode = stateZip.slice(1).join(" ");
    }
    if (parts.length == 4) {
      country = parts.slice(3).join(", ");
    }


    return { addressLine, city, state, zipCode, country };
  }

  const address = parseAddress(partner.address || "");

  const form = useForm({
    mode: "controlled",
    validateInputOnChange: true,
    validateInputOnBlur: true,
    initialValues: {
      organization: partner.name,
      description: partner.description || "",
      time: partner.start_partner || "",
      status: partner.waitlisted,
      latitude: partner.coords ? partner.coords.lat : "",
      longitude: partner.coords ? partner.coords.lng : "",
      addressLine: address.addressLine || "",
      city: address.city || "",
      state: address.state || "",
      zipCode: address.zipCode || "",
      country: address.country || "United States",
      logoFile: null as File | null,
      logoUrl: partner.logo_url || "",
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
      // logos are optional according to the figma?
      // logoFile: (_value, values) =>
      //   !values.logoFile && !values.logoUrl.trim()
      //     ? "Provide a file or a link"
      //     : null,
      logoUrl: (value, values) => {
        if (!value.trim() && !values.logoFile)
          return; // logos are optional according to the figma?
        return typeof value === "string" ? null : "Enter a valid URL";
      },
    },
  });

  async function submitEditPartner(values: typeof form.values) {
    const formData = {
      name: values.organization,
      description: values.description,
      start_partner: new Date(values.time).toISOString(),
      waitlisted: values.status,
      coordinates: {
        lat: values.latitude,
        long: values.longitude
      },
      address: values.addressLine + ", " + values.city + ", " + values.state + ", " + " " + values.zipCode,
      logo: values.logoUrl
    }

    const response = await fetch("http://localhost:3000/api/partners", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Failed to update partner data", err);
      return;
    }
  }

  return (
    <div>
      <div className="mb-5">
        <div>
          <h1 className="text-3xl text-black font-semibold">Edit Partner Information</h1>
          <h2 className="text-lg text-gray-500">Change your partner data</h2>
        </div>
      </div>

      <div className="p-4 border border-gray-300 rounded-xl">
        <form
          onSubmit={form.onSubmit((values) => { submitEditPartner(values) })}
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

          <Group justify="space-between" align="flex-start" w="100%">
            <Radio.Group
              key={form.key("status")}
              {...form.getInputProps("status")}
              error={form.errors.status}
              required
            >
              <Group justify="space-between" align="flex-start" w="150%">

                {/* Label with fixed width */}
                <Text fw={600} className="w-40">
                  Status <span className="text-red-600">*</span>
                </Text>

                {/* Radios */}
                <div className="flex gap-20">
                  <Radio value="active" label="Active" />
                  <Radio value="inactive" label="Inactive" />
                  <Radio value="waitlisted" label="Waitlisted" />
                </div>

              </Group>
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
                onChange={(val) => form.setFieldValue("latitude", String(val))}
                error={form.errors.latitude}
                size="md"
                className="min-w-83"
                radius="md"
                hideControls
              />
              <NumberInput
                placeholder="Longitude"
                key={form.key("longitude")}
                onChange={(val) => form.setFieldValue("longitude", String(val))}
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
                <NumberInput
                  placeholder="Zip Code"
                  key={form.key("zipCode")}
                  value={form.values.zipCode}
                  onChange={(val) => form.setFieldValue("zipCode", String(val))}
                  error={form.errors.zipCode}
                  size="md"
                  className="w-[120px]"
                  radius="md"
                  hideControls
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
              type="submit"
            >
              Submit
            </Button>
          </Group>
        </form>
      </div>
    </div>
  )
}