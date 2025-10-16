"use client";

import {
  Container,
  Anchor,
  Title,
  Paper,
  Text,
  Card,
  Stack,
  Divider,
} from "@mantine/core";
import ColinArayButton from "../../components/sprint1/ColinandarayButton";
import AryaaAshButton from "../../components/sprint1/AryaaAshButton";
import ButtonComponent from "../../components/sprint1/AnnarakshitcaitlynButton";
import ElchinMadelineButton from "../../components/sprint1/ElchinMadelineButton";
import OurButton from "../../components/sprint1/KimhenaoButton";

export default function onboardingticket() {
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
          Onboarding Ticket Page
        </Title>
        <Text>
          To view the onboarding ticket, please visit the Notion page{" "}
          <Anchor
            href="https://www.notion.so/Onboarding-Ticket-27bd0aafd3c2815aa91fc8a5b3778862"
            target="_blank"
            rel="noopener noreferrer">
            Onboarding Ticket
          </Anchor>
          .
        </Text>
      </Paper>
      <Card
        shadow="sm"
        radius="md"
        withBorder>
        <Stack gap="xs">
          <Stack gap="md">
            <div>
              <Text fw={500}>Aray - Colin</Text>
              <Card
                h={500}
                withBorder>
                <ColinArayButton />
              </Card>
            </div>
            <div>
              <Text fw={500}>Aryaa - Ashton</Text>
              <Card
                h={500}
                withBorder>
                {/* Aryaa - Ashton's onboarding ticket goes here */}
                <AryaaAshButton label="Click me!" />
              </Card>
            </div>
            <div>
              <Text fw={500}>Caitlyn - Anna - Rakshi</Text>
              <Card
                h={500}
                withBorder>
                {<ButtonComponent label="Click to see your age!" />}
              </Card>
            </div>
            <div>
              <Text fw={500}>Elchin - Madeline</Text>
              <Card
                h={500}
                withBorder>
                {/* Elchin - Madeline's onboarding ticket goes here */}
                <ElchinMadelineButton />
              </Card>
            </div>
            <div>
              <Text fw={500}>Valentina - Hanah</Text>
              <Card
                h={500}
                withBorder>
                {/* Valentina - Hanah's onboarding ticket goes here */}
                <OurButton />
              </Card>
            </div>
          </Stack>
        </Stack>
      </Card>
    </Container>
  );
}
