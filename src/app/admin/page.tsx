"use client";

import PartnerTable from "@/components/admin/PartnerTable";
import {
  Badge,
  Card,
  Center,
  CloseButton,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tabs,
  Button,
  Popover,
  Checkbox,
  TextInput,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { DateValue, MonthPickerInput, YearPickerInput } from "@mantine/dates";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import DistributionsTable from "@/components/admin/DistributionsTable";
import DistributionsSkeleton from "@/components/admin/DistributionsSkeleton";
import PartnerTableSkeleton from "@/components/admin/PartnerTableSkeleton";
import { useDisclosure } from "@mantine/hooks";
import UploadNewData from "../../components/admin/UploadDistributionDataForm";
import AddPartnerForm from "@/components/admin/AddPartnerForm";
import classes from "./AdminPage.module.css";
import { status } from "@/generated/prisma/enums";
import { Calendar, Search, SlidersHorizontal } from "lucide-react";

import DeleteDistributionDataButton from "@/components/admin/DeleteDistributionDataButton";
import { useUser } from "@clerk/nextjs";

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
  num_babies: number | null;
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

const parseMonth = (str: string | null) => {
  if (!str) return null;
  const parts = str.split("-");
  if (parts.length === 2) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
  }
  return null;
};

const formatMonth = (d: Date | null) => {
  if (!d) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const parseSinceYear = (str: string | null): Date | null => {
  if (!str || str === "All") return null;
  const y = Number(str);
  return isNaN(y) ? null : new Date(y, 0, 1);
};

function AdminPageContent() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get("tab") ?? "Partners";

  const handleTabChange = (tab: string | null) => {
    if (tab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };
  const [isFilterOpen, setFilterOpen] = useState(false);

  const [distributionsError, setDistributionsError] = useState<string>();
  const [partnersError, setPartnersError] = useState<string>();

  // URL-driven filtering state
  const partnerYearSince = searchParams.get("since") || "All";
  const partnerStatusQuery = searchParams.get("status");
  const partnerStatus = useMemo(
    () => (partnerStatusQuery ? partnerStatusQuery.split(",") : []),
    [partnerStatusQuery],
  );

  const dateRange = useMemo<[Date | null, Date | null]>(
    () => [parseMonth(searchParams.get("from")), parseMonth(searchParams.get("to"))],
    [searchParams],
  );

  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [percentages, setPercentages] = useState<PartnerRegionWithCity[]>([]);

  const [partnerSearch, setPartnerSearch] = useState(searchParams.get("search") || "");
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);

  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [filteredDistributions, setFilteredDistributions] = useState<Distribution[]>([]);
  const [isLoadingDistributions, setIsLoadingDistributions] = useState(true);

  // Sync back input to URL
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (partnerSearch) params.set("search", partnerSearch);
      else params.delete("search");
      if (params.toString() !== searchParams.toString()) {
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [partnerSearch, searchParams, router]);

  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    if (urlSearch !== partnerSearch) {
      setPartnerSearch(urlSearch);
    }
  }, [searchParams]);

  const setParamAndReplace = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const fetchDistributions = useCallback(async () => {
    setIsLoadingDistributions(true);
    try {
      const response = await fetch("/api/distributions");
      if (!response.ok) throw new Error("Failed to fetch distributions");
      const data = await response.json();
      // Handle both array and object responses
      const distributions = Array.isArray(data) ? data : data.distributions || [];
      setDistributions(distributions);
      setFilteredDistributions(distributions);
    } catch (err) {
      setDistributionsError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoadingDistributions(false);
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
      setPartnersError(err instanceof Error ? err.message : "An error occurred");
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
  const [timelineYears, setTimelineYears] = useState<string[]>([]);
  const currentYear = new Date().getFullYear();

  const fetchTimelineData = useCallback(async () => {
    try {
      const res = await fetch(`/api/timeline-slider?year=${currentYear}`);
      const data = await res.json();
      if (data.years) {
        setTimelineYears(data.years.map(String));
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

  useEffect(() => {
    let filtered = [...distributions];

    const fromStr = dateRange[0] ? formatMonth(dateRange[0]) : null;
    const toStr = dateRange[1] ? formatMonth(dateRange[1]) : null;

    if (fromStr || toStr) {
      const fromYear = fromStr ? fromStr.substring(0, 4) : null;
      const toYear = toStr ? toStr.substring(0, 4) : null;

      filtered = filtered.filter((dist) => {
        if (!dist.month) {
          // Yearly-only records: compare by year alone
          const distYear = dist.year ?? "";
          if (fromYear && distYear < fromYear) return false;
          if (toYear && distYear > toYear) return false;
          return true;
        }
        const monthNum = monthMap[dist.month.trim()];
        if (!monthNum) return false;
        const yymm = `${dist.year}-${monthNum}`;
        if (fromStr && yymm < fromStr) return false;
        if (toStr && yymm > toStr) return false;
        return true;
      });
    }

    setFilteredDistributions(filtered);
  }, [distributions, dateRange]);

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
        return new Date(p.start_partner).getUTCFullYear() === Number(partnerYearSince);
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
    setFilterOpen((open) => !open);
  };

  const handleSinceYearChange = (val: DateValue) => {
    if (!val) {
      setParamAndReplace("since", null);
    } else {
      const year = (val instanceof Date ? val : new Date(val)).getUTCFullYear();
      setParamAndReplace("since", String(year));
    }
  };

  const resetDistributionFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const resetPartnerFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("since");
    params.delete("status");
    params.delete("search");
    router.replace(`?${params.toString()}`, { scroll: false });
    setPartnerSearch("");
  };

  const activePartnerFilterCount =
    (partnerYearSince !== "All" ? 1 : 0) + partnerStatus.length + (partnerSearch ? 1 : 0);

  const activeDistributionFilterCount = (dateRange[0] ? 1 : 0) + (dateRange[1] ? 1 : 0);

  const handleDateRangeChange = (val: any) => {
    const params = new URLSearchParams(searchParams.toString());
    const fromDate: Date | null =
      val[0] instanceof Date ? val[0] : val[0] ? new Date(val[0]) : null;
    const toDate: Date | null = val[1] instanceof Date ? val[1] : val[1] ? new Date(val[1]) : null;

    const fromStr = formatMonth(fromDate);
    const toStr = formatMonth(toDate);

    if (fromStr) params.set("from", fromStr);
    else params.delete("from");

    if (toStr) params.set("to", toStr);
    else params.delete("to");

    router.replace(`?${params.toString()}`, { scroll: false });
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
    <Stack gap="lg" px="lg" pt="md">
      <Card p={0}>
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={2}>
              Hello, {user && user.firstName} {user && "👋"}
            </Title>
            <Group gap="xl" wrap="wrap">
              <Text size="sm" c="dimmed">
                Last data uploaded: {lastUploaded}
              </Text>
            </Group>
          </Stack>
          <UploadNewData
            opened={openedUploadDataForm}
            onClose={handleCloseUploadDataForm}
            onUploaded={onDataUpload}
            uploadedMonths={uploadedMonths}
          />
          <AddPartnerForm
            opened={openedPartnerForm}
            onClose={() => {
              closePartnerForm();
            }}
          />
          <Button
            onClick={handleAddClick}
            variant="outline"
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

          <Group ml="auto" align="flex-start" gap="sm">
            {!isPartnersTab && (
              <DeleteDistributionDataButton
                onSuccess={async () => {
                  await fetchDistributions();
                  await fetchTimelineData();
                }}
              />
            )}
            {isPartnersTab && (
              <TextInput
                placeholder="Search by name or cities..."
                value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.currentTarget.value)}
                radius="md"
                w={240}
                leftSection={<Search size={16} />}
                rightSection={
                  partnerSearch ? (
                    <CloseButton size="sm" onClick={() => setPartnerSearch("")} />
                  ) : null
                }
              />
            )}

            <Popover
              opened={isFilterOpen}
              onChange={setFilterOpen}
              position="bottom-end"
              width={300}
              shadow="md"
            >
              <Popover.Target>
                <Button
                  variant="default"
                  onClick={handleFilterClick}
                  rightSection={
                    <Image src="/admin_view/filter.svg" alt="filter icon" width={16} height={16} />
                  }
                  className="mb-2"
                >
                  Filter
                  {(isPartnersTab ? activePartnerFilterCount : activeDistributionFilterCount) >
                    0 && (
                    <Badge size="xs" circle color="var(--color-brand)" ml={6}>
                      {isPartnersTab ? activePartnerFilterCount : activeDistributionFilterCount}
                    </Badge>
                  )}
                </Button>
              </Popover.Target>
              <Popover.Dropdown>
                {isPartnersTab ? (
                  <Stack gap="xs">
                    <Group justify="space-between" align="center">
                      <Text fw={600}>Joined in year</Text>
                      {activePartnerFilterCount > 0 && (
                        <Button onClick={resetPartnerFilters} variant="subtle" size="xs">
                          Clear Filters
                        </Button>
                      )}
                    </Group>
                    <YearPickerInput
                      placeholder="Any year"
                      value={parseSinceYear(partnerYearSince)}
                      onChange={handleSinceYearChange}
                      clearable
                      minDate={
                        timelineYears.length > 0
                          ? new Date(Number(timelineYears[0]), 0, 1)
                          : new Date(2000, 0, 1)
                      }
                      maxDate={
                        timelineYears.length > 0
                          ? new Date(Number(timelineYears[timelineYears.length - 1]), 11, 31)
                          : new Date(currentYear, 11, 31)
                      }
                      popoverProps={{ withinPortal: false }}
                      mb="xs"
                    />
                    <Text fw={600}>Status</Text>
                    <Stack>
                      {statuses.map((statusItem) => (
                        <Checkbox
                          key={statusItem.value}
                          label={statusItem.label}
                          checked={partnerStatus.includes(statusItem.value)}
                          color="brand"
                          onChange={(e) => {
                            const checked = e.currentTarget.checked;
                            const current = new Set(partnerStatus);
                            if (checked) current.add(statusItem.value);
                            else current.delete(statusItem.value);
                            const arr = Array.from(current);
                            setParamAndReplace("status", arr.length > 0 ? arr.join(",") : null);
                          }}
                        />
                      ))}
                    </Stack>
                  </Stack>
                ) : (
                  <Stack gap="xs">
                    <Group justify="space-between" align="center">
                      <Text fw={600}>Date Range</Text>
                      <Button
                        onClick={resetDistributionFilters}
                        variant="subtle"
                        color="brand"
                        radius="md"
                        size="xs"
                      >
                        Clear Filters
                      </Button>
                    </Group>
                    <MonthPickerInput
                      defaultLevel="decade"
                      leftSection={<Calendar size={18} />}
                      type="range"
                      placeholder="Pick dates range"
                      value={dateRange}
                      onChange={handleDateRangeChange}
                      popoverProps={{ withinPortal: false }}
                    />
                  </Stack>
                )}
              </Popover.Dropdown>
            </Popover>
          </Group>
        </Tabs.List>

        <Tabs.Panel value="Partners">
          {partnersError ? (
            <Center py={80}>
              <Stack align="center" ta="center" gap="md">
                <ThemeIcon size={80} radius="xl" variant="light" color="red">
                  <IconAlertCircle size={48} stroke={1.5} />
                </ThemeIcon>
                <Title order={3} c="red.7">
                  Failed to load partners
                </Title>
                <Text c="dimmed" maw={400}>
                  {partnersError}
                </Text>
                <Button
                  variant="default"
                  radius="md"
                  c="brand"
                  onClick={() => {
                    setPartnersError(undefined);
                    void fetchPartners();
                  }}
                >
                  Try again
                </Button>
              </Stack>
            </Center>
          ) : isLoadingPartners ? (
            <PartnerTableSkeleton />
          ) : filteredPartners.length === 0 ? (
            <Center py={80}>
              <Stack align="center" ta="center" gap="md">
                <ThemeIcon size={80} radius="xl" variant="light" color="blue">
                  <SlidersHorizontal size={40} />
                </ThemeIcon>
                <Title order={3} c="dimmed">
                  No partners match your filters
                </Title>
                <Text c="dimmed" maw={360}>
                  Try adjusting your search or filter criteria.
                </Text>
                <Button variant="outline" color="brand" radius="md" onClick={resetPartnerFilters}>
                  Clear Filters
                </Button>
              </Stack>
            </Center>
          ) : (
            <PartnerTable
              partners={filteredPartners}
              refreshTable={refreshTable}
              percentages={percentages}
              loading={false}
            />
          )}
        </Tabs.Panel>
        <Tabs.Panel value="Diapers">
          {isLoadingDistributions ? (
            <DistributionsSkeleton />
          ) : distributionsError ? (
            <Center py={80}>
              <Stack align="center" ta="center" gap="md">
                <ThemeIcon size={80} radius="xl" variant="light" color="red">
                  <IconAlertCircle size={48} stroke={1.5} />
                </ThemeIcon>
                <Title order={3} c="red.7">
                  Failed to load distributions
                </Title>
                <Text c="dimmed" maw={400}>
                  {distributionsError}
                </Text>
                <Button
                  variant="default"
                  radius="md"
                  c="brand"
                  onClick={() => {
                    setDistributionsError(undefined);
                    void fetchDistributions();
                  }}
                >
                  Try again
                </Button>
              </Stack>
            </Center>
          ) : filteredDistributions.length === 0 && distributions.length > 0 ? (
            <Center py={80}>
              <Stack align="center" ta="center" gap="md">
                <ThemeIcon size={80} radius="xl" variant="light" color="blue">
                  <SlidersHorizontal size={40} />
                </ThemeIcon>
                <Title order={3} c="dimmed">
                  No distributions match your filters
                </Title>
                <Text c="dimmed" maw={360}>
                  Try adjusting the date range or clear the filters.
                </Text>
                <Button variant="outline" onClick={resetDistributionFilters}>
                  Clear Filters
                </Button>
              </Stack>
            </Center>
          ) : (
            <DistributionsTable
              distributionData={filteredDistributions}
              onDataUpdated={fetchDistributions}
            />
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

export default function Page() {
  return (
    <Suspense>
      <AdminPageContent />
    </Suspense>
  );
}
