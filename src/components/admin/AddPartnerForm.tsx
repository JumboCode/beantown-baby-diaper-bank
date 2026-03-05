"use client";

import {
  Button,
  Group,
  TextInput,
  Text,
  TagsInput,
  Textarea,
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
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

// --- API Helper Function ---
const fetchCoordsFromAddress = async (address: string) => {
  const apiKey = "580b89e66bc6968ea58bac6909e6598c898970a";
  try {
    const response = await fetch(
      `https://api.geocod.io/v1.9/geocode?q=${encodeURIComponent(address)}&api_key=${apiKey}`
    );
    const data = await response.json();
    return data.results?.[0]?.location; // { lat, lng }
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
};

export default function AddPartnerForm({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const [isLoadingCities, setIsLoadingCities] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const form = useForm({
    mode: "controlled",
    initialValues: {
      organization: "",
      description: "",
      time: null as Date | null,
      cities: [] as string[],
      status: "active",
      latitude: "",
      longitude: "",
      addressLine: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
      logoFile: null as File | null,
      logoUrl: "",
    },
  });

  // --- Auto-populate Coordinates Logic ---
  useEffect(() => {
    const { addressLine, city, state, zipCode } = form.values;

    // Trigger only if the core address fields are filled
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

  async function submitPartner(values: typeof form.values) {
    setIsSubmitting(true);
    
    // Format the address string for the DB
    const fullAddress = `${values.addressLine}, ${values.city}, ${values.state} ${values.zipCode}, ${values.country}`;

    const partnerPayload = {
      name: values.organization,
      description: values.description,
      start_partner: values.time ? values.time.toISOString() : null,
      status: values.status,
      coordinates: {
        lat: Number(values.latitude),
        lng: Number(values.longitude),
      },
      address: fullAddress,
      logo: values.logoUrl || "",
      cities: values.cities.map(c => ({ city: c, percentage: 1 })), // Defaulting percentage for now
    };

    try {
      const body = new FormData();
      body.append("partner", JSON.stringify(partnerPayload));
      body.append("logoAction", values.logoFile ? "replace" : "keep");
      if (values.logoFile) body.append("file", values.logoFile);

      const response = await fetch("/api/partners", {
        method: "PUT",
        body: body,
      });

      if (response.ok) {
        form.reset();
        onClose();
        window.dispatchEvent(new Event("partners:refresh"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} size={900} title={<Text fw={700} size="xl">Add New Partner</Text>}>
      <LoadingOverlay visible={isSubmitting} />
      <form onSubmit={form.onSubmit(submitPartner)}>
        <Stack>
          <TextInput label="Organization Name" placeholder="Name" {...form.getInputProps("organization")} required />
          <Textarea label="Description" placeholder="What do they do?" {...form.getInputProps("description")} required />
          
          <Radio.Group label="Status" {...form.getInputProps("status")}>
            <Group mt="xs">
              <Radio value="active" label="Active" />
              <Radio value="waitlisted" label="Waitlisted" />
            </Group>
          </Radio.Group>

          {/* --- REORDERED: Address Fields ABOVE Coords --- */}
          <Box>
            <Text fw={600} mb="xs">Address</Text>
            <Stack gap="xs">
              <TextInput placeholder="Address Line" {...form.getInputProps("addressLine")} required />
              <SimpleGrid cols={2}>
                <TextInput placeholder="City" {...form.getInputProps("city")} required />
                <Select placeholder="State" data={US_STATES} {...form.getInputProps("state")} searchable required />
                <TextInput placeholder="Zip Code" {...form.getInputProps("zipCode")} required />
                <Select placeholder="Country" data={countries} {...form.getInputProps("country")} />
              </SimpleGrid>
            </Stack>
          </Box>

          <Box>
            <Text fw={600} mb="xs">Coordinates (Auto-filled from Address)</Text>
            <Group grow>
              <NumberInput placeholder="Latitude" {...form.getInputProps("latitude")} hideControls readOnly />
              <NumberInput placeholder="Longitude" {...form.getInputProps("longitude")} hideControls readOnly />
            </Group>
          </Box>

          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" color="#053766">Submit Partner</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}