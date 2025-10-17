"use client";

import { Container, Title, Paper, Divider } from "@mantine/core";
import OurSlider from "../../components/sprint2/OurSlider";
import DotPopUps from "@/components/sprint2/DotPopUps";
import YearlyMonthlySwitch from "@/components/sprint2/YearlyMonthlySwitch";
import FileUpload from "@/components/sprint2/FileUpload";

export default function Sprint2Page() {
  return (
    <Container
      size="sm"
      py="xl">
      <Paper
        shadow="md"
        p="xl"
        radius="md"
        withBorder>
        <Title
          order={1}
          mb="md">
          Sprint 2 Page
        </Title>
      </Paper>

      <Title
        order={2}
        mt="md"
        mb="xs">
        Fun Slider
      </Title>
      <div>
        <OurSlider />
      </div>
      <Divider />

      <Title
        order={2}
        mt="md"
        mb="xs">
        MAKE AN IMPACT
      </Title>
      <div>{/* MAKE an Impact component goes here */}</div>
      <Divider />
      <Title
        order={2}
        mt="md"
        mb="xs">
        File Upload Button
      </Title>
      <div>
        <FileUpload />
      </div>
      <Divider />
      <Title
        order={2}
        mt="md"
        mb="xs">
        Displaying City Info
      </Title>
      <div>
        <DotPopUps />
      </div>
      <Divider />
      <Title
        order={2}
        mt="md"
        mb="xs">
        Yearly vs Monthly Switch
      </Title>
      <div>
        <YearlyMonthlySwitch />
      </div>

      <div>{/* Yearly vs Monthly Switch component goes here */}</div>
    </Container>
  );
}
