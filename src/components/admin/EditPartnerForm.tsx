import { useState, useEffect, useMemo } from "react";
import { DateValue, MonthPickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import {
  Modal,
  Button,
  Text,
  Radio,
  Group,
  Table,
  Stack,
  Loader,
  Center,
  Title,
} from "@mantine/core";
import { ConfirmDeletion } from "./ConfirmDeleteDistModal";
import { Distribution } from "@/lib/types";

export interface MonthSelectionData {
  mode: "one_month" | "range";
  start: { month: number; year: number };
  end: { month: number; year: number } | null;
}

interface MonthSelectionModalProps {
  onSuccess?: () => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={() => {
          setIsPreviewMode(false);
          setPreviewData([]);
          close();
        }}
        title={<Title order={3}>Delete Records</Title>}
        size="70%"
        centered
      >
        <Stack gap="md">
          <Radio.Group
            value={numMonths}
            onChange={(val) => {
              setNumMonths(val);
              setIsPreviewMode(false);
              setPreviewData([]);
            }}
            label="Select deletion type"
          >
            <Group mt="xs">
              <Radio value="one_month" label="One Month" color="#053766" />
              <Radio value="range" label="Range of Months" color="#053766" />
            </Group>
          </Radio.Group>

          {numMonths === "one_month" ? (
            <MonthPickerInput
              label="Select Month"
              placeholder="Pick a month"
              value={oneMonth}
              onChange={(val) => {
                setOneMonth(val);
                setIsPreviewMode(false);
              }}
              clearable
              // FIX 1: shouldDisableDate removed to allow all dates
            />
          ) : (
            <MonthPickerInput
              type="range"
              label="Select Range"
              placeholder="Pick a range"
              value={monthsRange}
              onChange={(val) => {
                setMonthsRange(val);
                setIsPreviewMode(false);
              }}
              clearable
              // FIX 1: shouldDisableDate removed to allow all dates
            />
          )}

          <Button
            onClick={handlePreviewClick}
            disabled={
              numMonths === "one_month"
                ? !oneMonth
                : !monthsRange[0] || !monthsRange[1]
            }
            color="#053766"
          >
            Show Preview
          </Button>

          {loadingDistributions ? (
            <Center py="xl">
              <Loader color="#053766" />
            </Center>
          ) : isPreviewMode ? (
            <Stack>
              <Title order={4}>Preview</Title>
              {previewData.length > 0 ? (
                <>
                  <div
                    style={{
                      maxHeight: "300px",
                      overflowY: "auto",
                      border: "1px solid #eee",
                      borderRadius: "8px",
                    }}
                  >
                    <Table stickyHeader verticalSpacing="sm">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Organization</Table.Th>
                          <Table.Th>City</Table.Th>
                          <Table.Th>Diapers</Table.Th>
                          <Table.Th>Children</Table.Th>
                          <Table.Th>Month</Table.Th>
                          <Table.Th>Year</Table.Th>
                        </Table.Tr>
                      </Table.Thead>

                      <Table.Tbody>
                        {/* FIX 2: Using the sorted data array */}
                        {sortedPreviewData.map((dist) => (
                          <Table.Tr
                            key={`${dist.id}-${dist.month}-${dist.year}-${dist.createdAt}`}
                          >
                            <Table.Td>{dist.partner?.name}</Table.Td>
                            <Table.Td>{dist.city?.name}</Table.Td>
                            <Table.Td>{dist.numberDiapers}</Table.Td>
                            <Table.Td>{dist.numberChildren}</Table.Td>
                            <Table.Td>{dist.month}</Table.Td>
                            <Table.Td>{dist.year}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </div>
                  <ConfirmDeletion
                    count={previewData.length}
                    onConfirm={deletePreviewedDistributions}
                  />
                </>
              ) : (
                <Text c="dimmed">No records found for this selection.</Text>
              )}
            </Stack>
          ) : (
            <Text c="dimmed" size="sm">
              Select a date range and click "Show Preview" to see records.
            </Text>
          )}
        </Stack>
      </Modal>
      <Button variant="default" radius={5} onClick={open}>
        Delete
      </Button>
    </>
  );
}