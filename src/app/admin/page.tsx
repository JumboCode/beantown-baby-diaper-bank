"use client";

import PartnerTable from "@/components/admin/PartnerTable";
import { Card, Group, Stack, Text, Title, Tabs, Button, Box, Flex} from "@mantine/core";
import { useState } from "react";
import Image from "next/image";
import { Poppins } from "next/font/google";
import DistributionsTable from "@/components/DistributionsTable";
import MonthSelectionModal from "@/components/admin/MonthSelectionModal";
import { useDisclosure } from '@mantine/hooks';
import UploadNewData from "./UploadNewData";
import AddPartnerForm from "@/components/AddPartnerForm";
import classes from "./AdminPage.module.css";

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
          <Button
            ml="auto"
            variant="default"
            radius={5}
            style={{ alignSelf: "center", marginRight: 4, marginBottom: 4 }}
            c="#053766"
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
