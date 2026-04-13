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
import { useUser } from "@clerk/nextjs";

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
  logoUrl: string | null;
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const statuses = (Object.values(status) as string[]).map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

export default function Page() {
  const { user } = useUser();
  const hashToTab = (hash: string): string => (hash === "#diapers" ? "Diapers" : "Partners");

  const [activeTab, setActiveTab] = useState<string | null>("Partners");

  useEffect(() => {
    setActiveTab(hashToTab(window.location.hash));

    const onHashChange = () => setActiveTab(hashToTab(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleTabChange = (tab: string | null) => {
    setActiveTab(tab);
    if (tab) window.location.hash = tab.toLowerCase();
  };
  const [isDrawerOpen, drawerControls] = useDisclosure(false);
  const [isPartnerFilterOpen, setPartnerFilterOpen] = useState(false);

  const [error, setError] = useState<string>();

  // partner filtering
  const [partnerYearSince, setPartnerYearSince] = useState<string | null>("All");
  const [partnerStatus, setPartnerStatus] = useState<string[]>([]);

  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [percentages, setPercentages] = useState<PartnerRegionWithCity[]>([]);
  const [partnerSearch, setPartnerSearch] = useState("");
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);

  const [valueFrom, setValueFrom] = useState<string | null>(null);
  const [valueTo, setValueTo] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [filteredDistributions, setFilteredDistributions] = useState<Distribution[]>([]);

  const fetchDistributions = useCallback(async () => {
    try {
      const response = await fetch("/api/distributions");
      if (!response.ok) throw new Error("Failed to fetch distributions");
      const data = await response.json();
      // Handle both array and object responses
      const distributions = Array.isArray(data) ? data : data.distributions || [];
      setDistributions(distributions);
      setFilteredDistributions(distributions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, []);

  const fetchPartners = useCallback(async () => {
    setIsLoadingPartners(true);
    try {
      const response = await fetch("/api/partners");
      if (!response.ok) throw new Error("Failed to fetch partners");
      const result = await response.json();
      setPartners(result.data);
      setFilteredPartners(result.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoadingPartners(false);
    }
  }, []);

  const fetchPercentages = useCallback(async () => {
    try {
      const response = await fetch("/api/partners/percentages");
      const result = await response.json();
      const normalized = (result.data ?? []).map((entry: PartnerRegionApiResponse) => ({
        ...entry,
        partnerId: Number(entry.partnerId),
        cityId: Number(entry.cityId),
        city: {
          ...entry.city,
          id: Number(entry.city.id),
        },
      }));
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

  useEffect(() => {
    const handlePartnersRefresh = () => {
      fetchPartners();
      fetchPercentages();
    };

    window.addEventListener("partners:refresh", handlePartnersRefresh);
    return () => {
      window.removeEventListener("partners:refresh", handlePartnersRefresh);
    };
  }, [fetchPartners, fetchPercentages]);

  const [uploadedMonths, setUploadedMonths] = useState<number[]>([]);
  const [lastUploaded, setLastUploaded] = useState<string | null>(null);
  const [years, setYears] = useState<string[]>(["All"]);
  const currentYear = new Date().getFullYear();

  const fetchTimelineData = useCallback(async () => {
    try {
      const res = await fetch(`/api/timeline-slider?year=${currentYear}`);
      const data = await res.json();
      if (data.years) {
        setYears(["All", ...data.years.map(String)]);
      }
      if (data.months) {
        const validMonths = data.months.filter(
          (d: { Month: string | null; Year: string | null }) =>
            typeof d.Month === "string" && typeof d.Year === "string",
        );
        const currentYearMonths = validMonths.filter(
          (d: { Month: string; Year: string }) => d.Year === String(currentYear),
        );
        const indices = currentYearMonths
          .map((d: { Month: string; Year: string }) =>
            MONTHS.findIndex((m) => d.Month.startsWith(m)),
          )
          .filter((index: number) => index >= 0);
        setUploadedMonths(indices);

        if (validMonths.length > 0) {
          const last = validMonths[validMonths.length - 1];
          setLastUploaded(`${last.Month} ${last.Year}`);
        } else {
          setLastUploaded(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch timeline data:", err);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchTimelineData();
  }, [fetchTimelineData]);

  const filterDistributions = () => {
    if (valueFrom && valueTo && valueFrom > valueTo) {
      setDateRangeError("'From' date must be before 'To' date.");
      return;
    }
    setDateRangeError(null);

    const fromYear = valueFrom ? parseInt(valueFrom.slice(0, 4)) : null;
    const toYear = valueTo ? parseInt(valueTo.slice(0, 4)) : null;

    const filtered = distributions.filter((dist) => {
      const distYear = parseInt(dist.year);
      const monthNum = dist.month ? monthMap[dist.month.trim()] : null;

      if (!monthNum) {
        if (fromYear !== null && distYear < fromYear) return false;
        if (toYear !== null && distYear > toYear) return false;
        return true;
      }

      const distYYYYMM = `${dist.year}-${monthNum}`;
      if (valueFrom && distYYYYMM < valueFrom) return false;
      if (valueTo && distYYYYMM > valueTo) return false;
      return true;
    });

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
        return new Date(p.start_partner).getUTCFullYear() <= Number(partnerYearSince);
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
  }, [partners, partnerYearSince, partnerStatus, partnerSearch, partnerCitiesMap]);

  const refreshTable = useCallback(() => {
    fetchPartners();
  }, [fetchPartners]);

  const [openedUploadDataForm, { open: openUploadDataForm, close: closeUploadDataForm }] =
    useDisclosure(false);

  const [openedPartnerForm, { open: openPartnerForm, close: closePartnerForm }] =
    useDisclosure(false);

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
    setValueFrom(null);
    setValueTo(null);
    setDateRangeError(null);
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

    return <Image src={icon} alt={`${tab.toLowerCase()} tab icon`} height={16} width={16} />;
  };

  const onDataUpload = async () => {
    await fetchDistributions();
    await fetchTimelineData();
  };

  const handleCloseUploadDataForm = () => {
    fetchTimelineData();
    closeUploadDataForm();
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
                <Title order={2}>Hello, {user?.firstName ?? "Admin"} 👋</Title>
                <Group gap="xl" wrap="wrap">
                  <Text size="sm" c="dimmed">
                    Last data uploaded: {lastUploaded ?? "N/A"}
                  </Text>
                </Group>
              </Stack>
              <UploadNewData
                opened={openedUploadDataForm}
                onClose={handleCloseUploadDataForm}
                onUploaded={onDataUpload}
                uploadedMonths={uploadedMonths}
              />
              <AddPartnerForm opened={openedPartnerForm} onClose={closePartnerForm} />
              <Button
                onClick={handleAddClick}
                variant="default"
                radius="md"
                c="#053766"
                rightSection={
                  <Image src="/admin_view/add_icon.svg" alt="add button" width={16} height={16} />
                }
              >
                {isPartnersTab ? "Add A New Partner" : "Upload New Data"}
              </Button>
            </Group>
          </Card>

          <Tabs
            classNames={classes}
            value={activeTab}
            onChange={handleTabChange}
            styles={{
              list: {
                "--tabs-border-color": "transparent",
              },
            }}
          >
            <Tabs.List mb="16px">
              <Tabs.Tab value="Partners" leftSection={renderTabIcon("Partners")}>
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
                  Filter the diaper distribution data by date range.
                </p>
                <h2 className="text-gray-900 font-semibold mb-2">Date Range</h2>
                <h3 className="text-gray-900 font-medium">From</h3>
                <MonthPickerInput
                  placeholder="Pick date"
                  value={valueFrom ? `${valueFrom}-01` : null}
                  onChange={(val) =>
                    setValueFrom(val ? (val as unknown as string).slice(0, 7) : null)
                  }
                  className="mb-3"
                />

                <h3 className="text-gray-900 font-medium">To</h3>
                <MonthPickerInput
                  placeholder="Pick date"
                  value={valueTo ? `${valueTo}-01` : null}
                  onChange={(val) =>
                    setValueTo(val ? (val as unknown as string).slice(0, 7) : null)
                  }
                  className="mb-6"
                />
                {dateRangeError && (
                  <Text c="red" size="sm" mb="sm">
                    {dateRangeError}
                  </Text>
                )}
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
                {!isPartnersTab && <DeleteDistributionDataButton onSuccess={fetchDistributions} />}
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
                      radius="md"
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
                loading={isLoadingPartners}
              />
            </Tabs.Panel>
            <Tabs.Panel value="Diapers">
              <DistributionsTable
                distributionData={filteredDistributions}
                onDataUpdated={fetchDistributions}
              />
            </Tabs.Panel>
          </Tabs>
        </>
      )}
    </Stack>
  );
}
