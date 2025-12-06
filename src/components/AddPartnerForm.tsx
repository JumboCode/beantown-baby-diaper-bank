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
  Container,
  Stack,
  SimpleGrid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { MonthPickerInput } from "@mantine/dates";
import { useState, useEffect } from "react";
import "@mantine/dates/styles.css";

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

  useEffect(() => {
    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const res = await fetch(
          "http://api.geonames.org/searchJSON?q=&adminCode1=MA&country=US&featureClass=P&username=jumbocodebbdb",
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
      time: "",
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
      time: (value) => (value.length > 0 ? null : "Select a start time"),
      cities: (value) => (value.length > 0 ? null : "Pick at least one city"),
      latitude: requiredNumber("Latitude"),
      longitude: requiredNumber("Longitude"),
      state: (value) =>
        typeof value === "string" ? null : "State name must be a string",
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

  async function submitPartner(values: typeof form.values) {
    const formData = {
      name: values.organization,
      description: values.description,
      start_partner: new Date(values.time).toISOString(),
      waitlisted: values.status,
      coordinates: {
        lat: Number(values.latitude),
        long: Number(values.longitude),
      },
      address:
        values.addressLine +
        ", " +
        values.city +
        ", " +
        values.state +
        ", " +
        " " +
        values.zipCode +
        ", " +
        values.country,
      logo: values.logoUrl || "",
    };

    const response = await fetch("/api/partners", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Failed to create partner", err);
      return;
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

      <form
        onSubmit={form.onSubmit((values) => {
          submitPartner(values);
        })}
      >
        <Stack>
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
              key={form.key("description")}
              {...form.getInputProps("description")}
              size="md"
              w={526}
              radius="md"
              required
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
              }}
              error={form.errors.cities}
              size="md"
              w={526}
              radius="md"
            />
            {/* <MultiSelect
              disabled={isLoadingCities}
              nothingFoundMessage="Nothing found..."
              key={form.key("cities")}
              value={form.values.cities}
              onChange={(values) => {
                form.setFieldValue("cities", values);
              }}
              error={form.errors.cities}
              size="md"
              className="min-w-170"
              radius="md"
            /> */}
          </Group>

          {/* Selected Cities Table with Percentages, sorry this looks digusting */}
          <Group w={526} ml="auto" justify="flex-end">
            {/* Selected Cities Table */}
            {form.values.cities.length > 0 && (
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
                              setPercentages((prev) => ({
                                ...prev,
                                [city]: typeof value === "number" ? value : 0,
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
          <Group justify="space-between" align="flex-start">
            <Text c="#344054" fz={16} fw={600}>
              Time it started <span className="text-red-600">*</span>
            </Text>
            <MonthPickerInput
              placeholder="Pick date"
              key={form.key("time")}
              {...form.getInputProps("time")}
              required
              w={526}
            />
          </Group>

          {/* Status */}
          <Radio.Group
            key={form.key("status")}
            {...form.getInputProps("status")}
            error={form.errors.status}
            required
          >
            <Group justify="space-between">
              <Text c="#344054" fz={16} fw={600}>
                Status <span className="text-red-600">*</span>
              </Text>
              <Group w={526} justify="space-between">
                <Radio value="active" label="Active" />
                <Radio value="inactive" label="Inactive" />
                <Radio value="waitlisted" label="Waitlisted" />
              </Group>
            </Group>
          </Radio.Group>

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
                <TextInput
                  placeholder="State"
                  key={form.key("state")}
                  {...form.getInputProps("state")}
                  size="md"
                  radius="md"
                  required
                />

                <NumberInput
                  placeholder="Zip Code"
                  key={form.key("zipCode")}
                  value={form.values.zipCode}
                  onChange={(val) => form.setFieldValue("zipCode", String(val))}
                  error={form.errors.zipCode}
                  size="md"
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
                value={form.values.logoFile}
                onChange={(file) => form.setFieldValue("logoFile", file)}
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
          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              color="#053766"
              radius="md"
              type="button"
              onClick={() => {
                form.reset();
                setPercentages({});
              }}
            >
              Cancel
            </Button>
            <Button variant="filled" color="#053766" radius="md" type="submit">
              Submit
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
