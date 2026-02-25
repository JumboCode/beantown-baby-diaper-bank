"use client";

import PartnerTable from "@/components/admin/PartnerTable";
import {
  Card,
  Group,
  Stack,
  Text,
  Title,
  Tabs,
  Button,
  Drawer,
  Select,
  Popover,
  Checkbox,
  TextInput,
} from "@mantine/core";
import { MonthPickerInput } from "@mantine/dates";
import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { Poppins } from "next/font/google";
import DistributionsTable from "@/components/admin/DistributionsTable";
import { useDisclosure } from "@mantine/hooks";
import UploadNewData from "../../components/admin/UploadDistributionDataForm";
import AddPartnerForm from "@/components/admin/AddPartnerForm";
import classes from "./AdminPage.module.css";
import { status } from "@/generated/prisma/enums";
import { Search } from "lucide-react";

import DeleteDistributionDataButton from "@/components/admin/DeleteDistributionDataButton";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

interface Distribution {
  id: string;
  createdAt: string;
  partnerId: string;
  cityId: string;
  year: string;
  month: string;
  numberDiapers: string;
  numberChildren: string;
  percentage: number;
  partner: {
    name: string;
  };
  city: {
    name: string;
  };
}

type Partner = {
  id: number;
  created_at: string;
  name: string;
  description: string | null;
  start_partner: string | null;
  status: status;
  address: string | null;
  coords?: { lat: number; lng: number };
  logo_url: string | null;
};

type PartnerRegionWithCity = {
  partnerId: number;
  cityId: number;
  percentage: number | null;
  city: {
    id: number;
    name: string;
  };
};

type PartnerRegionApiResponse = {
  partnerId: string | number;
  cityId: string | number;
  percentage: number | null;
  city: {
    id: string | number;
    name: string;
  };
};

const monthMap: Record<string, string> = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12",
};

const years: Array<string> = ["All", "2023", "2024", "2025"];

const statuses = (Object.values(status) as string[]).map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

export default function Page() {
  const [activeTab, setActiveTab] = useState<string | null>("Partners");
  const [isDrawerOpen, drawerControls] = useDisclosure(false);
  const [isPartnerFilterOpen, setPartnerFilterOpen] = useState(false);

  const [error, setError] = useState<string>();

  // partner filtering
  const [partnerYearSince, setPartnerYearSince] = useState<string | null>(
    "All",
  );
  const [partnerStatus, setPartnerStatus] = useState<string[]>([]);

  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [percentages, setPercentages] = useState<PartnerRegionWithCity[]>([]);
  const [partnerSearch, setPartnerSearch] = useState("");

  // diaper filtering
  const [valueFrom, setValueFrom] = useState<string | null>(null);
  const [valueTo, setValueTo] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);

  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [filteredDistributions, setFilteredDistributions] = useState<
    Distribution[]
  >([]);

  const fetchDistributions = useCallback(async () => {
    try {
      const response = await fetch("/api/distributions");
      if (!response.ok) throw new Error("Failed to fetch distributions");
      const data = await response.json();
      // Handle both array and object responses
      const distributions = Array.isArray(data)
        ? data
        : data.distributions || [];
      setDistributions(distributions);
      setFilteredDistributions(distributions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, []);

  const fetchPartners = useCallback(async () => {
    try {
      const response = await fetch("/api/partners");
      const result = await response.json();
      setPartners(result.data);
      setFilteredPartners(result.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }, []);

  const fetchPercentages = useCallback(async () => {
    try {
      const response = await fetch("/api/partners/percentages");
      const result = await response.json();
      const normalized = (result.data ?? []).map(
        (entry: PartnerRegionApiResponse) => ({
          ...entry,
          partnerId: Number(entry.partnerId),
          cityId: Number(entry.cityId),
          city: {
            ...entry.city,
            id: Number(entry.city.id),
          },
        }),
      );
      setPercentages(normalized);
    } catch (err) {
      console.log("Error fetching percentages data", err);
    }
  }, []);

  useEffect(() => {
    fetchDistributions();
  }, [fetchDistributions]);

  useEffect(() => {
    fetchPartners();
    fetchPercentages();
  }, [fetchPartners, fetchPercentages]);

  const formatMonthKeyFromDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const toMonthKey = (value: string | null) => {
    if (!value) return null;

    const trimmed = value.trim();

    if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed.slice(0, 7);

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;

    return formatMonthKeyFromDate(parsed);
  };

  const filterDistributions = () => {
    let filtered = [...distributions];

    if (orgName) {
      filtered = filtered.filter((dist) => dist.partner.name === orgName);
    }

    if (city) {
      filtered = filtered.filter((dist) => dist.city.name === city);
    }

    const distToYYYYMM = (dist: Distribution) => {
      const monthNum = monthMap[dist.month.trim()];
      if (!monthNum) {
        console.warn(`Unknown month: "${dist.month}"`);
        return "0000-00";
      }
      return `${dist.year}-${monthNum}`;
    };

    const fromKey = toMonthKey(valueFrom);
    if (fromKey) {
      filtered = filtered.filter((d) => distToYYYYMM(d) >= fromKey);
    }

    const toKey = toMonthKey(valueTo);
    if (toKey) {
      filtered = filtered.filter((d) => distToYYYYMM(d) <= toKey);
    }

    setFilteredDistributions(filtered);
    drawerControls.close();
  };

  const partnerCitiesMap = useMemo(() => {
    const map = new Map<number, string[]>();

    percentages.forEach((p) => {
      const partnerId = Number(p.partnerId);
      const cityName = p.city?.name?.trim();

      if (!map.has(partnerId)) {
        map.set(partnerId, []);
      }

      if (cityName) {
        map.get(partnerId)!.push(cityName);
      }
    });

    return map;
  }, [percentages]);

  useEffect(() => {
    let filtered = [...partners];

    if (partnerYearSince && partnerYearSince !== "All") {
      filtered = filtered.filter((p) => {
        if (!p.start_partner) return false;
        return (
          new Date(p.start_partner).getFullYear() <= Number(partnerYearSince)
        );
      });
    }

    if (partnerStatus.length > 0) {
      filtered = filtered.filter((p) => partnerStatus.includes(p.status));
    }

    if (partnerSearch.trim()) {
      const q = partnerSearch.toLowerCase();

      filtered = filtered.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);

        const cities = partnerCitiesMap.get(p.id) ?? [];
        const cityMatch = cities.some((c) => c.toLowerCase().includes(q));

        return nameMatch || cityMatch;
      });
    }

    setFilteredPartners(filtered);
  }, [
    partners,
    partnerYearSince,
    partnerStatus,
    partnerSearch,
    partnerCitiesMap,
  ]);

  const refreshTable = useCallback(() => {
    fetch("/api/partners")
      .then((response) => response.json())
      .then((result) => {
        console.log("Refetched partner data:", result.data);
        setPartners(result.data);
      })
      .catch((err) => {
        console.error("Error refetching data:", err);
      });
  }, []);

  const organizationOptions = useMemo(
    () => [...new Set(distributions.map((d) => d.partner.name))],
    [distributions],
  );

  const cityOptions = useMemo(
    () => [...new Set(distributions.map((d) => d.city.name))],
    [distributions],
  );

  const [
    openedUploadDataForm,
    { open: openUploadDataForm, close: closeUploadDataForm },
  ] = useDisclosure(false);

  const [
    openedPartnerForm,
    { open: openPartnerForm, close: closePartnerForm },
  ] = useDisclosure(false);

  const isPartnersTab = activeTab === "Partners";

  const handleAddClick = () => {
    if (activeTab === "Diapers") {
      openUploadDataForm();
    } else {
      openPartnerForm();
    }
  };

  const handleFilterClick = () => {
    if (activeTab === "Partners") {
      setPartnerFilterOpen((open) => !open);
    } else {
      drawerControls.open();
    }
  };

  const resetDistributionFilters = () => {
    setOrgName(null);
    setValueFrom(null);
    setValueTo(null);
    setCity(null);
    setFilteredDistributions(distributions);
    drawerControls.close();
  };

  const renderTabIcon = (tab: "Partners" | "Diapers") => {
    const isActive = activeTab === tab;
    const icon =
      tab === "Partners"
        ? isActive
          ? "/admin_view/partners_tab_blue.svg"
          : "/admin_view/partners_tab_gray.svg"
        : isActive
          ? "/admin_view/diapers_tab_blue.svg"
          : "/admin_view/diapers_tab_gray.svg";

    return (
      <Image
        src={icon}
        alt={`${tab.toLowerCase()} tab icon`}
        height={16}
        width={16}
      />
    );
  };

  return (
    <Stack mx="72px" my="44px" gap="lg" className={poppins.className}>
      {error ? (
        <Text c="red">Error: {error}</Text>
      ) : (
        <>
          <Card p={0}>
            <Group justify="space-between" align="flex-start">
              <Stack gap={4}>
                <Title order={2}>Hello, Rachel 👋</Title>
                <Group gap="xl" wrap="wrap">
                  <Text size="sm" c="dimmed">
                    Last data uploaded: Monday, 30 Aug, 2025
                  </Text>
                  <Text size="sm" c="dimmed">
                    Last updated: Friday, 2 Sep, 2025
                  </Text>
                </Group>
              </Stack>
              <UploadNewData
                opened={openedUploadDataForm}
                onClose={closeUploadDataForm}
                onUploaded={fetchDistributions}
              />
              <AddPartnerForm
                opened={openedPartnerForm}
                onClose={closePartnerForm}
              />
              <Button
                onClick={handleAddClick}
                variant="default"
                radius="md"
                c="#053766"
                rightSection={
                  <Image
                    src="/admin_view/add_icon.svg"
                    alt="add button"
                    width={16}
                    height={16}
                  />
                }
              >
                {isPartnersTab ? "Add A New Partner" : "Upload New Data"}
              </Button>
            </Group>
          </Card>

          <Tabs
            classNames={classes}
            value={activeTab}
            onChange={setActiveTab}
            styles={{
              list: {
                "--tabs-border-color": "transparent",
              },
            }}
          >
            <Tabs.List mb="16px">
              <Tabs.Tab
                value="Partners"
                leftSection={renderTabIcon("Partners")}
              >
                Partners
              </Tabs.Tab>
              <Tabs.Tab value="Diapers" leftSection={renderTabIcon("Diapers")}>
                Diapers
              </Tabs.Tab>

              <Drawer
                opened={isDrawerOpen}
                onClose={drawerControls.close}
                position="right"
                size="sm"
              >
                <h1 className="font-bold text-gray-900">Filter Data</h1>
                <p className="text-gray-500 mb-6">
                  Filter the diaper distribution data by organization, city, and
                  date range.
                </p>
                <h2 className="text-gray-900 font-semibold">
                  Organization Name
                </h2>
                <Select
                  data={organizationOptions}
                  value={orgName}
                  onChange={setOrgName}
                  placeholder="All organizations"
                  className="mb-6"
                />

                <h2 className="text-gray-900 font-semibold">City</h2>
                <Select
                  data={cityOptions}
                  value={city}
                  onChange={setCity}
                  placeholder="All cities"
                  className="mb-6"
                />

                <h2 className="text-gray-900 font-semibold mb-2">Date Range</h2>
                <h3 className="text-gray-900 font-medium">From</h3>
                <MonthPickerInput
                  placeholder="Pick date"
                  value={valueFrom}
                  onChange={setValueFrom}
                  className="mb-3"
                />

                <h3 className="text-gray-900 font-medium">To</h3>
                <MonthPickerInput
                  placeholder="Pick date"
                  value={valueTo}
                  onChange={setValueTo}
                  className="mb-6"
                />
                <div className="flex justify-between">
                  <Button
                    onClick={resetDistributionFilters}
                    variant="outline"
                    color="#053766"
                    radius="md"
                  >
                    Clear Filters
                  </Button>
                  <Button
                    onClick={filterDistributions}
                    variant="filled"
                    color="#053766"
                    radius="md"
                  >
                    Apply Filters
                  </Button>
                </div>
              </Drawer>

              <Group ml="auto" align="flex-start" gap="sm">
                {!isPartnersTab && <DeleteDistributionDataButton />}
                {isPartnersTab && (
                  <TextInput
                    placeholder="Search by name or cities..."
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.currentTarget.value)}
                    radius="md"
                    w={240}
                    leftSection={<Search size={16} />}
                  />
                )}

                <Popover
                  opened={isPartnerFilterOpen && isPartnersTab}
                  onChange={setPartnerFilterOpen}
                  position="bottom-end"
                  width={300}
                  shadow="md"
                >
                  <Popover.Target>
                    <Button
                      variant="default"
                      radius={5}
                      onClick={handleFilterClick}
                      rightSection={
                        <Image
                          src="/admin_view/filter.svg"
                          alt="filter icon"
                          width={16}
                          height={16}
                        />
                      }
                      className="mb-2"
                    >
                      Filter
                    </Button>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Stack gap="xs">
                      <h3>
                        <strong>Year Since</strong>
                      </h3>
                      <Group gap={7} mb="xs">
                        {years.map((year) => {
                          const isSelected = partnerYearSince === year;

                          return (
                            <Button
                              key={year}
                              variant={isSelected ? "filled" : "outline"}
                              color="#053766"
                              radius="md"
                              onClick={() => setPartnerYearSince(year)}
                            >
                              {year}
                            </Button>
                          );
                        })}
                      </Group>
                      <h3>
                        <strong>Status</strong>
                      </h3>
                      <Stack>
                        {statuses.map((status) => (
                          <Checkbox
                            key={status.value}
                            label={status.label}
                            checked={partnerStatus.includes(status.value)}
                            color="#053766"
                            onChange={(e) => {
                              const checked = e.currentTarget.checked;

                              setPartnerStatus((prev) =>
                                checked
                                  ? [...prev, status.value]
                                  : prev.filter((s) => s !== status.value),
                              );
                            }}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  </Popover.Dropdown>
                </Popover>
              </Group>
            </Tabs.List>

            <Tabs.Panel value="Partners">
              <PartnerTable
                partners={filteredPartners}
                refreshTable={refreshTable}
                percentages={percentages}
              />
            </Tabs.Panel>
            <Tabs.Panel value="Diapers">
              <DistributionsTable distributionData={filteredDistributions} />
            </Tabs.Panel>
          </Tabs>
        </>
      )}
    </Stack>
  );
}
