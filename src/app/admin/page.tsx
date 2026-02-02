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
  TextInput,
} from "@mantine/core";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Poppins } from "next/font/google";
import DistributionsTable from "@/components/DistributionsTable";
import MonthSelectionModal from "@/components/admin/MonthSelectionModal";
import { useDisclosure } from "@mantine/hooks";
import UploadNewData from "./UploadNewData";
import AddPartnerForm from "@/components/AddPartnerForm";
import classes from "./AdminPage.module.css";
import { status } from "@/generated/prisma/enums";
import { MonthPickerInput } from "@mantine/dates";

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

export default function Page() {
  const [activeTab, setActiveTab] = useState<string | null>("Partners");

  // Data State
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [filteredDistributions, setFilteredDistributions] = useState<Distribution[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]); // Added for PartnerTable
  const [percentages, setPercentages] = useState<PartnerRegionWithCity[]>([]); // Added for PartnerTable
  const [error, setError] = useState<string | null>(null);

  // Filter State for Distributions
  const [orgName, setOrgName] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [valueFrom, setValueFrom] = useState<Date | null>(null);
  const [valueTo, setValueTo] = useState<Date | null>(null);

  // UI State
  const [
    openedUploadDataForm,
    { open: openUploadDataForm, close: closeUploadDataForm },
  ] = useDisclosure(false);

  const [
    openedPartnerForm,
    { open: openPartnerForm, close: closePartnerForm },
  ] = useDisclosure(false);

  // Drawer for Distribution Filters
  const [drawerOpened, drawerControls] = useDisclosure(false);

  const isPartnersTab = activeTab === "Partners";

  // --- Data Fetching ---
  const fetchDistributions = async () => {
    try {
      const response = await fetch("/api/distributions");
      if (!response.ok) throw new Error("Failed to fetch distributions");
      const data = await response.json();
      setDistributions(data);
      setFilteredDistributions(data); // Initial set
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const fetchPartners = async () => {
    try {
      const res = await fetch("/api/partners");
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || []);
        setPercentages(data.percentages || []);
      }
    } catch (e) {
      console.error("Failed to fetch partners", e);
    }
  };

  useEffect(() => {
    fetchDistributions();
    fetchPartners();
  }, []);

  // --- Handlers ---

  const handleAddClick = () => {
    if (activeTab === "Diapers") {
      openUploadDataForm();
    } else {
      openPartnerForm();
    }
  };

  const handleFilterClick = () => {
    if (activeTab === "Partners") {
      console.log("Partner filter clicked");
    } else {
      drawerControls.open();
    }
  };

  const applyDistributionFilters = () => {
    let filtered = [...distributions];

    if (orgName) {
      filtered = filtered.filter((d) =>
        d.partner.name.toLowerCase().includes(orgName.toLowerCase())
      );
    }

    if (city) {
      filtered = filtered.filter((d) =>
        d.city.name.toLowerCase().includes(city.toLowerCase())
      );
    }

    if (valueFrom) {
      const fromTime = valueFrom.getTime();
      filtered = filtered.filter((d) => {
        const distDate = new Date(`${d.month} 1, ${d.year}`);
        return distDate.getTime() >= fromTime;
      });
    }

    if (valueTo) {
      const toTime = valueTo.getTime();
      filtered = filtered.filter((d) => {
        const distDate = new Date(`${d.month} 1, ${d.year}`);
        return distDate.getTime() <= toTime;
      });
    }

    setFilteredDistributions(filtered);
    drawerControls.close();
  };

  const resetDistributionFilters = () => {
    setOrgName(null);
    setValueFrom(null);
    setValueTo(null);
    setCity(null);
    setFilteredDistributions(distributions);
  };

  const handleDeleteSuccess = () => {
    fetchDistributions(); // Refetch after delete
  };

  return (
    <Stack mx="72px" my="44px" gap="lg" className={poppins.className}>
      {error && <Text c="red">Error: {error}</Text>}

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
          <Button
            ml="auto"
            variant="default"
            radius={5}
            style={{ alignSelf: "center", marginRight: 4, marginBottom: 4 }}
            c="#053766"
            onClick={handleFilterClick}
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
        </Tabs.List>

        <Tabs.Panel value="Partners">
          <PartnerTable partners={partners} percentages={percentages} refreshTable={fetchPartners} />
        </Tabs.Panel>
        <Tabs.Panel value="Diapers">
          <Stack gap="1rem">
            <div style={{ alignSelf: 'flex-end' }}>
              <MonthSelectionModal onSuccess={handleDeleteSuccess} />
            </div>
            <DistributionsTable distributionData={filteredDistributions} />
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Filter Drawer for Distributions */}
      <Drawer
        opened={drawerOpened}
        onClose={drawerControls.close}
        position="right"
        title={<Text fw={700} size="lg">Filter Distributions</Text>}
        padding="md"
      >
        <Stack gap="md">
          <TextInput
            label="Organization Name"
            placeholder="Search by name"
            value={orgName || ""}
            onChange={(e) => setOrgName(e.currentTarget.value)}
          />
          <TextInput
            label="City"
            placeholder="Search by city"
            value={city || ""}
            onChange={(e) => setCity(e.currentTarget.value)}
          />

          <MonthPickerInput
            label="From"
            placeholder="Pick date"
            value={valueFrom}
            onChange={setValueFrom}
          />
          <MonthPickerInput
            label="To"
            placeholder="Pick date"
            value={valueTo}
            onChange={setValueTo}
          />

          <Group justify="space-between" mt="xl">
            <Button variant="default" onClick={resetDistributionFilters}>Reset</Button>
            <Button color="#163663" onClick={applyDistributionFilters}>Apply Filters</Button>
          </Group>
        </Stack>
      </Drawer>
    </Stack>
  );
}
