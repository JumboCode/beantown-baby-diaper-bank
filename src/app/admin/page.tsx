"use client";

import PartnerTable from "@/components/admin/PartnerTable";
import { Card, Group, Stack, Text, Title, Tabs, Button, Box, Flex} from "@mantine/core";
import { useState } from "react";
import Image from "next/image";
import { Poppins } from "next/font/google";
import DistributionsTable from "@/components/DistributionsTable";
import MonthSelectionModal from "@/components/admin/MonthSelectionModal";
import PreviewModal from "@/components/admin/PreviewModal";
import { useDisclosure } from '@mantine/hooks';
import type { MonthSelectionData } from "@/components/admin/MonthSelectionModal";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// const MONTH_NAMES = [
//   "January",
//   "February",
//   "March",
//   "April",
//   "May",
//   "June",
//   "July",
//   "August",
//   "September",
//   "October",
//   "November",
//   "December",
// ];

export default function Page() {
  const [activeTab, setActiveTab] = useState<string | null>("Partners");
  const [monthModalOpen, { open: openMonthModal, close: closeMonthModal }] = useDisclosure(false);
  // const [previewData, setPreviewData] = useState<any[]>([]);

  // async function fetchPreviewMonthSelection(selection:MonthSelectionData) {
  //   const { mode, start, end } = selection;
  //   if (mode === "one_month") {
  //     console.log("in fetch: one month");
  //     console.log(start.month);

  //     const monthName = MONTH_NAMES[start.month + 1];
  //     console.log(monthName);

  //     const preview = await fetch(`http://localhost:3000/api/distributions?month=${monthName}&year=${start.year}`);
  //     if (!preview.ok) {
  //       console.error("Error: could not fetch distributions for", monthName);
  //     } else {
  //       const preview_json = await preview.json()
  //       setPreviewData(preview_json);
  //       console.log(preview_json);
  //     }
  //   } else { // i think we can just make this else but idk  
  //     console.log("in fetch: range");
  //     let currMonth = start.month;
  //     let currYear = start.year;

  //     if (end === null) return;
  //     const allResults = [];

  //     // need to have the months increment even if at the end of the year
  //     // year takes on 2 states, at the end, or less than the end?
  //     while ((currMonth <= end.month) && (currYear < end.year || currYear == end.year)) {
  //       const monthName = MONTH_NAMES[end.month + 1];
  //       const curr_preview = await fetch(`http://localhost:3000/api/distributions?month=${monthName}&year=${currYear}`)
  //       if (!curr_preview.ok) {
  //         console.error("Error: could not fetch distributions for", monthName);
  //       } else {
  //         const json = await curr_preview.json();
  //         allResults.push(...json); // ... spreads out the json items
  //       }

  //       currMonth++;
  //       if (currMonth > 12) {
  //         currMonth = 1;
  //         currYear++;
  //       }
  //     }
      
  //     setPreviewData(allResults);
  //   }

  //   console.log(previewData);
  // }


  return (
    <Stack
      gap="lg"
      className={poppins.className}>
      <Card>
        <Group
          justify="space-between"
          align="flex-start">
          <Stack gap={4}>
            <Title order={2}>Hello, Rachel 👋</Title>
            <Group
              gap="xl"
              wrap="wrap">
              <Text
                size="sm"
                c="dimmed">
                Last data uploaded: Monday, 30 Aug, 2025
              </Text>
              <Text
                size="sm"
                c="dimmed">
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
            }>
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
        }}>
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
            }>
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
            }>
            Diapers
          </Tabs.Tab>

          <Flex
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              gap:10,
            }}
          >
            {/* <Button
              variant="default"
              radius={5}
              onClick={openMonthModal}
            >
              Delete
            </Button> */}

            
            <MonthSelectionModal />
            {/* <PreviewModal /> */}
            <Button
              ml="auto"
              variant="default"
              radius={5}
              // style={{ alignSelf: "center", marginRight: 4, marginBottom: 4 }}
              rightSection={
                <Image
                  src="/admin_view/filter.svg"
                  alt="filter icon"
                  width={16}
                  height={16}
                />
              }>
              Filter
            </Button>
          </Flex>
        </Tabs.List>

        <Tabs.Panel value="Partners">
          <PartnerTable />
        </Tabs.Panel>
        <Tabs.Panel value="Diapers">
          <DistributionsTable />
        </Tabs.Panel>
      </Tabs>
      
      {/* <MonthSelectionModal 
        opened={monthModalOpen}
        onClose={closeMonthModal}
        onSubmit={fetchPreviewMonthSelection}
      /> */}

    </Stack>
  );
}
