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

  const form = useForm({
    mode: "controlled",
    validateInputOnChange: true,
    validateInputOnBlur: true,
    initialValues: {
      organization: "",
      description: "",
      time: "",
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
      time: (value) => (value.length > 0 ? null : "Select a start time"),
      latitude: requiredNumber("Latitude"),
      longitude: requiredNumber("Longitude"),
      state: (value) =>
        typeof value === "string" ? null : "State name must be a string",
      zipCode: requiredInteger("Zip Code"),
      country: (value) => (value ? null : "Select a country"),
      status: (value) => (value ? null : "Select a status"),
      logoFile: (_value, values) =>
        !values.logoFile && !values.logoUrl.trim()
          ? "Provide a file or a link"
          : null,
      logoUrl: (value, values) => {
        if (!value.trim() && !values.logoFile)
          return "Provide a file or a link";
        return typeof value === "string" ? null : "Enter a valid URL";
      },
    },
  });

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
          //   onSubmit={}
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
              value={partner.name}
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
              value={partner.description ? partner.description : "No description"}
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
              value={partner.start_partner}
            />
          </Group>

          {/* Status */}
          <Radio.Group
            key={form.key("status")}
            {...form.getInputProps("status")}
            error={form.errors.status}
            required>
            <Group>
              <Text fw={600}>
                Status <span className="text-red-600">*</span>
              </Text>
              <div className="flex gap-40 ml-72">
                <Radio
                  value="active"
                  label="Active"
                />
                <Radio
                  value="inactive"
                  label="Inactive"
                />
                <Radio
                  value="waitlisted"
                  label="Waitlisted"
                />
              </div>
            </Group>
          </Radio.Group>

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
                value={partner.coords ? partner.coords.lat : "N/A"}
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
                value={partner.coords ? partner.coords.lng : "N/A"}
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
          <Group
            justify="space-between"
            align="flex-start">
            <Text fw={600}>
              Address <span className="text-red-600">*</span>
            </Text>
            <div className="flex flex-col gap-4 min-w-170">
                <TextInput
                placeholder="Address Line"
                key={form.key("addressLine")}
                {...form.getInputProps("addressLine")}
                size="md"
                className="min-w-170"
                radius="md"
                required
                value={partner.address ? partner.address : "N/A"}
                />
                <div className="gap-4 flex ml-68.5">
                <TextInput
                    placeholder="City"
                    key={form.key("city")}
                    {...form.getInputProps("city")}
                    size="md"
                    className="min-w-83"
                    radius="md"
                    required
                />
                <TextInput
                    placeholder="State"
                    key={form.key("state")}
                    {...form.getInputProps("state")}
                    size="md"
                    className="min-w-83"
                    radius="md"
                    required
                />
                </div>
                <div className="gap-4 flex ml-68.5">
                <NumberInput
                    placeholder="Zip Code"
                    key={form.key("zipCode")}
                    value={form.values.zipCode}
                    onChange={(val) => form.setFieldValue("zipCode", String(val))}
                    error={form.errors.zipCode}
                    size="md"
                    className="min-w-83"
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
                    onChange={(val) => {
                    form.setFieldValue("country", val || "");
                    }}
                    error={form.errors.country}
                    size="md"
                    className="min-w-83"
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
                value={form.values.logoFile}
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
                value={partner.logo_url || ""}
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
              type="submit">
              Submit
            </Button>
          </Group>
        </form>
      </div>
    </div>
  )
}