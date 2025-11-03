"use client";
import ColinMadelineAryaaHotmap from "@/components/sprint3/ColinMadelineAryaaHotmap";
import RakshiElchinMap from "@/components/sprint3/RakshiElchinMap";
import { Container, Title, Paper } from "@mantine/core";

export default function Sprint3Page() {
  return (
    <Container size="xxl">
      <Paper
        shadow="md"
        p="xl"
        radius="md"
        withBorder>
        <Title
          order={1}
          mb="md">
          Sprint 3 Page
        </Title>
      </Paper>

      <Title
        order={2}
        mt="md"
        mb="xs">
        Caitlyn - Hanah
      </Title>
      <div>{/* Caitlyn - Hanah map goes here */}</div>

      <Title
        order={2}
        mt="md"
        mb="xs">
        Rakshi - Elchin
      </Title>
      <div>
        <RakshiElchinMap />
      </div>

      <Title
        order={2}
        mt="md"
        mb="xs">
        Ashton - Valentina
      </Title>
      <div>{/* Ashton - Valentina map goes here */}</div>

      <Title
        order={2}
        mt="md"
        mb="xs">
        Ashton - Valentina
      </Title>
      <div>{/* Anna - Aray map goes here */}</div>

      <Title
        order={2}
        mt="md"
        mb="xs">
        Colin - Madeline - Aryaa
      </Title>
      <div>
        {/* Colin - Madeline - Aryaa map goes here */}
        <ColinMadelineAryaaHotmap />
      </div>
    </Container>
  );
}
