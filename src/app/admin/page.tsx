"use client";

import PartnerTable from "@/components/admin/PartnerTable";
import { Card, Group, Stack, Text, Title, Tabs, Button } from "@mantine/core";
import { useState } from "react";
import Image from "next/image";
import { Poppins } from "next/font/google";
import DistributionsTable from "@/components/DistributionsTable";
import { useDisclosure } from "@mantine/hooks";
import UploadNewData from "./UploadNewData";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function Page() {
  const [activeTab, setActiveTab] = useState<string | null>("Partners");
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Stack
      mx="72px"
      my="44px"
      gap="lg"
      className={poppins.className}>
      <Card p={0}>
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

          <UploadNewData
            opened={opened}
            onClose={close}
          />

          <Button
            onClick={() => {
              if (activeTab === "Diapers") {
                open();
              }
            }}
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
                  src="/admin_view/diapers_tab_gray.svg"
                  alt="partners inactive icon"
                  height={16}
                  width={16}
                />
              )
            }>
            Diapers
          </Tabs.Tab>
          <Button
            ml="auto"
            variant="default"
            radius={5}
            style={{ alignSelf: "center", marginRight: 4, marginBottom: 4 }}
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
        </Tabs.List>

        <Tabs.Panel value="Partners">
          <PartnerTable />
        </Tabs.Panel>
        <Tabs.Panel value="Diapers">
          <DistributionsTable />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
