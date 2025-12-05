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
} from "@mantine/core";
import { MonthPickerInput } from "@mantine/dates";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Poppins } from "next/font/google";
import DistributionsTable from "@/components/DistributionsTable";
import { useDisclosure } from "@mantine/hooks";

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

export default function Page() {
  const [activeTab, setActiveTab] = useState<string | null>("Partners");
  const [opened, { open, close }] = useDisclosure(false);
  const [isOpened, setOpened] = useState(false);

  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [filteredDistributions, setFilteredDistributions] = useState<
    Distribution[]
  >([]);
  const [error, setError] = useState<string>();

  const [valueFrom, setValueFrom] = useState<string | null>(null);
  const [valueTo, setValueTo] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);


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

  if (error) return <Text c="red">Error: {error}</Text>;

  return (
    <Stack gap="lg" className={poppins.className}>
      <Card>
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

          <Button
            variant="default"
            radius="md"
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
        defaultValue={activeTab}
        onChange={setActiveTab}
        styles={{
          list: {
            "--tabs-border-color": "transparent",
          },
        }}
      >
        <Tabs.List>
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
                  src="/admin_view/Diapers_tab_gray.svg"
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

          <Popover
            opened={isOpened && activeTab === "Partners"}
            onChange={setOpened}
            position="bottom-end"
            width={300}
            shadow="md"
          >
            <Popover.Target>
              <Button
                ml="auto"
                variant="default"
                radius={5}
                style={{ alignSelf: "center", marginRight: 4, marginBottom: 4 }}
                onClick={() => {
                  if (activeTab === "Partners") {
                    setOpened(!isOpened);
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
              >
                Filter
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              {/* Your filter content here */}

              <div>
                <h3>
                  <strong>Year Since</strong>
                </h3>
                <Group gap={7} mb="md">
                  <Button size="compact-md">All</Button>
                  <Button size="compact-md">2023</Button>
                  <Button size="compact-md">2024</Button>
                  <Button size="compact-md">2025</Button>
                </Group>
                <h3>
                  <strong>Status</strong>
                </h3>
                <Checkbox label="All"></Checkbox>
                <Checkbox label="Active"></Checkbox>
                <Checkbox label="Inactive"></Checkbox>
                <Checkbox label="Waitlisted"></Checkbox>
              </div>
            </Popover.Dropdown>
          </Popover>
        </Tabs.List>

        <Tabs.Panel value="Partners">
          <PartnerTable />
        </Tabs.Panel>
        <Tabs.Panel value="Diapers">
          <DistributionsTable distributionData={filteredDistributions} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
