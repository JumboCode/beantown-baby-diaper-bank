"use client";

import { usePathname, useRouter } from "next/navigation";
import { Card, Group, Stack, Title, Tabs, Button, Drawer } from "@mantine/core";
import { MonthPickerInput } from "@mantine/dates";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Poppins } from "next/font/google";
import DistributionsTable from "@/components/admin/DistributionsTable";
import { useDisclosure } from "@mantine/hooks";
import UploadNewData from "@/components/admin/UploadDistributionDataForm";
import classes from "../AdminPage.module.css";
import DeleteDistributionDataButton from "@/components/admin/DeleteDistributionDataButton";
import LastUploaded from "@/components/admin/LastUploaded";
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

export default function DistributionsPage() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [isDrawerOpen, drawerControls] = useDisclosure(false);

  const [valueFrom, setValueFrom] = useState<string | null>(null);
  const [valueTo, setValueTo] = useState<string | null>(null);

  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [filteredDistributions, setFilteredDistributions] = useState<Distribution[]>([]);

  const fetchDistributions = useCallback(async () => {
    try {
      const response = await fetch("/api/distributions");
      if (!response.ok) throw new Error("Failed to fetch distributions");
      const data = await response.json();
      const dists = Array.isArray(data) ? data : data.distributions || [];
      setDistributions(dists);
      setFilteredDistributions(dists);
    } catch (err) {
      console.error(err instanceof Error ? err.message : "An error occurred");
    }
  }, []);

  useEffect(() => {
    fetchDistributions();
  }, [fetchDistributions]);

  const [uploadedMonths, setUploadedMonths] = useState<number[]>([]);
  const currentYear = new Date().getFullYear();

  const fetchTimelineData = useCallback(async () => {
    try {
      const res = await fetch(`/api/timeline-slider?year=${currentYear}`);
      const data = await res.json();
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
      }
    } catch (err) {
      console.error("Failed to fetch timeline data:", err);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchTimelineData();
  }, [fetchTimelineData]);

  const filterDistributions = () => {
    let filtered = [...distributions];

    const distToYYYYMM = (dist: Distribution) => {
      if (!dist.month) return "0000-00";
      const monthNum = monthMap[dist.month.trim()];
      if (!monthNum) return "0000-00";
      return `${dist.year}-${monthNum}`;
    };

    if (valueFrom) {
      filtered = filtered.filter((dist) => distToYYYYMM(dist) >= valueFrom);
    }

    if (valueTo) {
      filtered = filtered.filter((dist) => distToYYYYMM(dist) <= valueTo);
    }

    setFilteredDistributions(filtered);
    drawerControls.close();
  };

  const [openedUploadDataForm, { open: openUploadDataForm, close: closeUploadDataForm }] =
    useDisclosure(false);

  const resetDistributionFilters = () => {
    setValueFrom(null);
    setValueTo(null);
    setFilteredDistributions(distributions);
    drawerControls.close();
  };

  const onDataUpload = async () => {
    await fetchDistributions();
    await fetchTimelineData();
    window.dispatchEvent(new Event("timeline:refresh"));
  };

  const handleCloseUploadDataForm = () => {
    fetchTimelineData();
    closeUploadDataForm();
  };

  const renderTabIcon = (tabPath: string) => {
    const isActive = pathname === tabPath;
    const isPartners = tabPath === "/admin/partners";
    const icon = isPartners
      ? isActive
        ? "/admin_view/partners_tab_blue.svg"
        : "/admin_view/partners_tab_gray.svg"
      : isActive
        ? "/admin_view/diapers_tab_blue.svg"
        : "/admin_view/diapers_tab_gray.svg";

    return (
      <Image
        src={icon}
        alt={`${isPartners ? "partners" : "diapers"} tab icon`}
        height={16}
        width={16}
      />
    );
  };

  return (
    <Stack mx="72px" my="44px" gap="lg" className={poppins.className}>
      <Card p={0}>
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={2}>Hello, {user?.firstName ?? "Admin"} 👋</Title>
            <Group gap="xl" wrap="wrap">
              <LastUploaded />
            </Group>
          </Stack>
          <UploadNewData
            opened={openedUploadDataForm}
            onClose={handleCloseUploadDataForm}
            onUploaded={onDataUpload}
            uploadedMonths={uploadedMonths}
          />
          <Button
            onClick={openUploadDataForm}
            variant="default"
            radius="md"
            c="#053766"
            rightSection={
              <Image src="/admin_view/add_icon.svg" alt="add button" width={16} height={16} />
            }
          >
            Upload New Data
          </Button>
        </Group>
      </Card>
      <Tabs
        classNames={classes}
        value={pathname}
        onChange={(value) => {
          if (value) router.push(value);
        }}
        styles={{
          list: {
            "--tabs-border-color": "transparent",
          },
        }}
      >
        <Tabs.List mb="16px">
          <Tabs.Tab value="/admin/partners" leftSection={renderTabIcon("/admin/partners")}>
            Partners
          </Tabs.Tab>
          <Tabs.Tab
            value="/admin/distributions"
            leftSection={renderTabIcon("/admin/distributions")}
          >
            Diapers
          </Tabs.Tab>

          <Drawer opened={isDrawerOpen} onClose={drawerControls.close} position="right" size="sm">
            <h1 className="font-bold text-gray-900">Filter Data</h1>
            <p className="text-gray-500 mb-6">Filter the diaper distribution data by date range.</p>
            <h2 className="text-gray-900 font-semibold mb-2">Date Range</h2>
            <h3 className="text-gray-900 font-medium">From</h3>
            <MonthPickerInput
              placeholder="Pick date"
              value={valueFrom ? (`${valueFrom}-01` as any) : null}
              onChange={(val) => setValueFrom(val ? (val as unknown as string).slice(0, 7) : null)}
              className="mb-3"
            />

            <h3 className="text-gray-900 font-medium">To</h3>
            <MonthPickerInput
              placeholder="Pick date"
              value={valueTo ? (`${valueTo}-01` as any) : null}
              onChange={(val) => setValueTo(val ? (val as unknown as string).slice(0, 7) : null)}
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
              <Button onClick={filterDistributions} variant="filled" color="#053766" radius="md">
                Apply Filters
              </Button>
            </div>
          </Drawer>

          <Group ml="auto" align="flex-start" gap="sm">
            <DeleteDistributionDataButton onSuccess={fetchDistributions} />
            <Button
              variant="default"
              radius={5}
              onClick={drawerControls.open}
              rightSection={
                <Image src="/admin_view/filter.svg" alt="filter icon" width={16} height={16} />
              }
              className="mb-2"
            >
              Filter
            </Button>
          </Group>
        </Tabs.List>
      </Tabs>
      <DistributionsTable
        distributionData={filteredDistributions}
        onDataUpdated={fetchDistributions}
      />
    </Stack>
  );
}
