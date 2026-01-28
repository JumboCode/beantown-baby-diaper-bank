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
import { useState, useEffect } from "react";
import Image from "next/image";
import { Poppins } from "next/font/google";
import DistributionsTable from "@/components/DistributionsTable";
import { useDisclosure } from "@mantine/hooks";
import UploadNewData from "./UploadNewData";
import AddPartnerForm from "@/components/AddPartnerForm";
import classes from "./AdminPage.module.css";
import { useDisclosure } from "@mantine/hooks";
import { status } from "@/generated/prisma/enums";
import { PartnerRegion } from "@/generated/prisma/client";
import { Search } from "lucide-react";

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

const statuses = [
  { label: "Ally", value: "ally" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Waitlisted", value: "waitlisted" },
] as const;

export default function Page() {
  const [activeTab, setActiveTab] = useState<string | null>("Partners");
  const [opened, { open, close }] = useDisclosure(false);
  const [isOpened, setOpened] = useState(false);

  const [error, setError] = useState<string>();

  // partner filtering
  const [partnerYearSince, setPartnerYearSince] = useState<string | null>(
    "All",
  );
  const [partnerStatus, setPartnerStatus] = useState<string[]>([]);

  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [percentages, setPercentages] = useState<PartnerRegion[]>([]);
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

  useEffect(() => {
    const fetchDistributions = async () => {
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
    };

    fetchDistributions();
  }, []);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await fetch("/api/partners");
        const result = await response.json();
        setPartners(result.data);
        setFilteredPartners(result.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    const fetchPercentages = async () => {
      try {
        const response = await fetch("/api/partners/percentages");
        const result = await response.json();
        setPercentages(result.data);
      } catch (err) {
        console.log("Error fetching percentages data", err);
      }
    };

    fetchPartners();
    fetchPercentages();
  }, []);

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

    if (valueFrom) {
      filtered = filtered.filter((d) => {
        const distDate = distToYYYYMM(d);
        return distDate >= valueFrom.slice(0, 7);
      });
    }

    if (valueTo) {
      filtered = filtered.filter((d) => {
        const distDate = distToYYYYMM(d);
        return distDate <= valueTo.slice(0, 7);
      });
    }

    setFilteredDistributions(filtered);
    close();
  };

  const partnerCitiesMap = new Map<number, string[]>();

  percentages.forEach((p) => {
    const partnerId = Number(p.partnerId);
    const cityId = String(p.cityId);

    if (!partnerCitiesMap.has(partnerId)) {
      partnerCitiesMap.set(partnerId, []);
    }

    partnerCitiesMap.get(partnerId)!.push(cityId);
  });

  useEffect(() => {
    let filtered = [...partners];

    if (partnerYearSince && partnerYearSince !== "All") {
      filtered = filtered.filter((p) => {
        if (!p.start_partner) return false;
        return (
          new Date(p.start_partner).getFullYear().toString() ===
          partnerYearSince
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
  }, [partners, partnerYearSince, partnerStatus, partnerSearch, percentages]);

  const refreshTable = () => {
    fetch("/api/partners")
      .then((response) => response.json())
      .then((result) => {
        console.log("Refetched partner data:", result.data);
        setPartners(result.data);
      })
      .catch((err) => {
        console.error("Error refetching data:", err);
      });
  };

  if (error) return <Text c="red">Error: {error}</Text>;
  const [
    openedUploadDataForm,
    { open: openUploadDataForm, close: closeUploadDataForm },
  ] = useDisclosure(false);

  const [
    openedPartnerForm,
    { open: openPartnerForm, close: closePartnerForm },
  ] = useDisclosure(false);

  return (
    <Stack mx="72px" my="44px" gap="lg" className={poppins.className}>
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
          />
          <AddPartnerForm
            opened={openedPartnerForm}
            onClose={closePartnerForm}
          />
          <Button
            onClick={() => {
              if (activeTab === "Diapers") {
                openUploadDataForm();
              } else {
                openPartnerForm();
              }
            }}
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
            {activeTab === "Partners" ? "Add A New Partner" : "Upload New Data"}
          </Button>
        </Group>
      </Card>

      <Tabs
        classNames={classes}
        defaultValue={activeTab}
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
            leftSection={
              activeTab === "Partners" ? (
                <Image
                  src="/admin_view/partners_tab_blue.svg"
                  alt="partners active icon"
                  height={16}
                  width={16}
                />
              ) : (
                <Image
                  src="/admin_view/partners_tab_gray.svg"
                  alt="partners inactive icon"
                  height={16}
                  width={16}
                />
              )
            }
          >
            Partners
          </Tabs.Tab>
          <Tabs.Tab
            value="Diapers"
            leftSection={
              activeTab === "Diapers" ? (
                <Image
                  src="/admin_view/diapers_tab_blue.svg"
                  alt="partners active icon"
                  height={16}
                  width={16}
                />
              ) : (
                <Image
                  src="/admin_view/diapers_tab_gray.svg"
                  alt="partners inactive icon"
                  height={16}
                  width={16}
                />
              )
            }
          >
            Diapers
          </Tabs.Tab>

          <Drawer opened={opened} onClose={close} position="right" size="sm">
            <h1 className="font-bold text-gray-900">Filter Data</h1>
            <p className="text-gray-500 mb-6">
              Filter the diaper distribution data by organization, city, and
              date range.
            </p>
            <h2 className="text-gray-900 font-semibold">Organization Name</h2>
            <Select
              data={[...new Set(distributions.map((d) => d.partner.name))]}
              value={orgName}
              onChange={setOrgName}
              placeholder="All organizations"
              className="mb-6"
            />

            <h2 className="text-gray-900 font-semibold">City</h2>
            <Select
              data={[...new Set(distributions.map((d) => d.city.name))]}
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
                onClick={() => {
                  setOrgName(null);
                  setValueFrom(null);
                  setValueTo(null);
                  setCity(null);
                  setFilteredDistributions(distributions);
                  close();
                }}
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

          <Group ml="auto" align="center" gap="sm">
            {activeTab === "Partners" && (
              <TextInput
                placeholder="Search by name or cities..."
                value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.currentTarget.value)}
                radius="md"
                w={240}
                leftSection={
                  <Search size={16} />
                }
                className="mb-2"
              />
            )}

            <Popover
              opened={isOpened && activeTab === "Partners"}
              onChange={setOpened}
              position="bottom-end"
              width={300}
              shadow="md"
            >
              <Popover.Target>
                <Button
                  variant="default"
                  radius={5}
                  onClick={() => {
                    if (activeTab === "Partners") {
                      setOpened((o) => !o);
                    } else {
                      open();
                    }
                  }}
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
                    {years.map((year) =>
                      partnerYearSince == year ? (
                        <Button
                          key={year}
                          variant="filled"
                          color="#053766"
                          radius="md"
                        >
                          {year}
                        </Button>
                      ) : (
                        <Button
                          key={year}
                          variant="outline"
                          color="#053766"
                          radius="md"
                          onClick={() => {
                            setPartnerYearSince(year);
                          }}
                        >
                          {year}
                        </Button>
                      ),
                    )}
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
    </Stack>
  );
}
