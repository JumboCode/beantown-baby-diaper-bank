"use client";

import { usePathname, useRouter } from "next/navigation";
import PartnerTable from "@/components/admin/PartnerTable";
import {
  Card,
  Group,
  Stack,
  Title,
  Tabs,
  Button,
  Popover,
  Checkbox,
  TextInput,
} from "@mantine/core";
import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { Poppins } from "next/font/google";
import { useDisclosure } from "@mantine/hooks";
import AddPartnerForm from "@/components/admin/AddPartnerForm";
import classes from "../AdminPage.module.css";
import LastUploaded from "@/components/admin/LastUploaded";
import { status } from "@/generated/prisma/enums";
import { Search } from "lucide-react";
import { useUser } from "@clerk/nextjs";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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

const statuses = (Object.values(status) as string[]).map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

export default function PartnersPage() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [isPartnerFilterOpen, setPartnerFilterOpen] = useState(false);

  // partner filtering
  const [partnerYearSince, setPartnerYearSince] = useState<string | null>("All");
  const [partnerStatus, setPartnerStatus] = useState<string[]>([]);

  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [percentages, setPercentages] = useState<PartnerRegionWithCity[]>([]);
  const [partnerSearch, setPartnerSearch] = useState("");
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);

  const [years, setYears] = useState<string[]>(["All"]);
  const currentYear = new Date().getFullYear();

  const fetchTimelineData = useCallback(async () => {
    try {
      const res = await fetch(`/api/timeline-slider?year=${currentYear}`);
      const data = await res.json();
      if (data.years) {
        setYears(["All", ...data.years.map(String)]);
      }
    } catch (err) {
      console.error("Failed to fetch timeline data:", err);
    }
  }, [currentYear]);

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
    fetchTimelineData();
    fetchPartners();
    fetchPercentages();
  }, [fetchTimelineData, fetchPartners, fetchPercentages]);

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

  const [openedPartnerForm, { open: openPartnerForm, close: closePartnerForm }] =
    useDisclosure(false);

  const handleFilterClick = () => {
    setPartnerFilterOpen((open) => !open);
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
          <AddPartnerForm opened={openedPartnerForm} onClose={closePartnerForm} />
          <Button
            onClick={openPartnerForm}
            variant="default"
            radius="md"
            c="#053766"
            rightSection={
              <Image src="/admin_view/add_icon.svg" alt="add button" width={16} height={16} />
            }
          >
            Add A New Partner
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

          <Group ml="auto" align="flex-start" gap="sm">
            <TextInput
              placeholder="Search by name or cities..."
              value={partnerSearch}
              onChange={(e) => setPartnerSearch(e.currentTarget.value)}
              radius="md"
              w={240}
              leftSection={<Search size={16} />}
            />

            <Popover
              opened={isPartnerFilterOpen}
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
                    <Image src="/admin_view/filter.svg" alt="filter icon" width={16} height={16} />
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
      </Tabs>
      <PartnerTable
        partners={filteredPartners}
        refreshTable={refreshTable}
        percentages={percentages}
        loading={isLoadingPartners}
      />
    </Stack>
  );
}
