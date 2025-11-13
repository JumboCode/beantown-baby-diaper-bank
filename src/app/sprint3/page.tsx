"use client";
import ColinMadelineAryaaHotmap from "@/components/sprint3/ColinMadelineAryaaHotmap";
import RakshiElchinMap from "@/components/sprint3/RakshiElchinMap";
import HanahCaitlynMap from "@/components/sprint3/WeiKimMap";
import { Container, Title, Paper } from "@mantine/core";
import AshValentinaMap from "@/components/sprint3/AshValentinaMap";
import HotMap from "./HotMap";

export default function Sprint3Page() {
  return (
    <Container size="80vw">
      <Paper shadow="md" p="xl" radius="md" withBorder>
        <Title order={1} mb="md">
          Sprint 3 Page
        </Title>
      </Paper>

      <Title order={2} mt="md" mb="xs">
        Caitlyn - Hanah
      </Title>
      <div>
        {" "}
        <HanahCaitlynMap />
      </div>

      <Title order={2} mt="md" mb="xs">
        Rakshi - Elchin
      </Title>
      <div>
        <RakshiElchinMap />
      </div>

      <Title order={2} mt="md" mb="xs">
        Ashton - Valentina
      </Title>
      <div>
        <AshValentinaMap />
      </div>
      <Title order={2} mt="md" mb="xs">
        Anna - Aray
      </Title>
      <div>{<HotMap />}</div>

      <Title order={2} mt="md" mb="xs">
        Colin - Madeline - Aryaa
      </Title>
      <div>
        {/* Colin - Madeline - Aryaa map goes here */}
        <ColinMadelineAryaaHotmap />
      </div>
    </Container>
  );
}
