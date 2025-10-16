"use client";
import AryaaAshButton from "@/components/AryaaAshButton";
import {
  Container,
  Title,
  Text,
  Button,
  List,
  Code,
  Anchor,
  Card,
  Divider,
  Paper,
  Stack,
  Group,
  ThemeIcon,
} from "@mantine/core";
import { FaGithub } from "react-icons/fa";
import ButtonComponent from "@/components/AnnarakshitcaitlynButton";
import OurButton from "@/components/KimhenaoButton";
import ColinArayButton from "@/components/ColinandarayButton";
import ElchinMadelineButton from "@/components/ElchinMadelineButton";

export default function Home() {
  return (
    <Container
      size="lg"
      py="xl">
      <Stack gap="xl">
        <Paper
          radius="md"
          shadow="xl"
          p="xl">
          <Stack gap="sm">
            <Group
              gap="sm"
              justify="space-between">
              <Title order={1}>Beantown Baby Diaper Bank</Title>
              <Button
                component="a"
                href="https://github.com/JumboCode/beantown-baby-diaper-bank"
                target="_blank"
                variant="outline"
                rightSection={<FaGithub size={18} />}>
                Open in GitHub
              </Button>
            </Group>
            <Text
              c="dimmed"
              size="lg">
              Welcome devs to the Beantown Baby Diaper Bank! This project is a
              JumboCode project to add new functionality to{" "}
              <Anchor
                href="https://beantownbabydiaperbank.org/"
                target="_blank"
                rel="noopener noreferrer">
                beantownbabydiaperbank.org
              </Anchor>
              . Built with{" "}
              <Anchor
                href="https://mantine.dev/"
                target="_blank"
                rel="noopener noreferrer">
                Mantine
              </Anchor>{" "}
              and{" "}
              <Anchor
                href="https://tailwindcss.com/"
                target="_blank"
                rel="noopener noreferrer">
                Tailwind
              </Anchor>
              , this page is here to help you get started, find resources, and
              contribute. We&apos;re excited to have you on the team!
            </Text>
          </Stack>

          <Card
            shadow="sm"
            radius="md"
            withBorder>
            <Stack gap="xs">
              <Title order={2}>Quick start</Title>

              <Divider />

              <List withPadding>
                <List.Item>
                  <Text
                    size="sm"
                    c="dimmed">
                    If you don&apos;t have Node.js installed, download it from{" "}
                    <Anchor
                      href="https://nodejs.org/"
                      target="_blank"
                      rel="noopener noreferrer">
                      nodejs.org
                    </Anchor>
                    .
                  </Text>
                </List.Item>
                <List.Item>
                  <Code>
                    git clone
                    https://github.com/JumboCode/beantown-baby-diaper-bank.git
                  </Code>{" "}
                  <Text
                    size="sm"
                    c="dimmed"
                    span>
                    — clones the project repository to your computer
                  </Text>
                </List.Item>
                <List.Item>
                  <Code>cd beantown-baby-diaper-bank</Code>
                  <Text
                    size="sm"
                    c="dimmed"
                    span>
                    {" "}
                    — changes into the project directory
                  </Text>
                </List.Item>
                <List.Item>
                  <Code>npm install</Code>
                  <Text
                    size="sm"
                    c="dimmed"
                    span>
                    {" "}
                    — installs all project dependencies
                  </Text>
                </List.Item>
                <List.Item>
                  <Code>npm run dev</Code>
                  <Text
                    size="sm"
                    c="dimmed"
                    span>
                    {" "}
                    — starts the development server so you can view the app
                    locally
                  </Text>
                </List.Item>
              </List>
            </Stack>
          </Card>
          <Card
            shadow="sm"
            radius="md"
            mt="md"
            withBorder>
            <Stack gap="xs">
              <Title order={2}>Next steps</Title>

              <Divider />
              <Text
                size="sm"
                c="dimmed">
                Run the following commands in your terminal:
                <Code>npm run dev</Code>
              </Text>

              <Text
                size="sm"
                c="dimmed">
                Open{" "}
                <Anchor
                  href="http://localhost:3000"
                  target="_blank">
                  http://localhost:3000
                </Anchor>{" "}
                with your browser to see the result.
              </Text>
              <Text
                size="sm"
                c="dimmed">
                You can start editing the page by modifying{" "}
                <Code>app/page.tsx</Code>. The page auto-updates as you edit the
                file.
              </Text>
              <Text
                size="sm"
                c="dimmed">
                This project uses <b>Next.js</b> for routing, server-side
                rendering, and more. Learn more in the{" "}
                <Anchor
                  href="https://nextjs.org/docs"
                  target="_blank"
                  rel="noopener noreferrer">
                  Next.js documentation
                </Anchor>
                .
              </Text>
            </Stack>
          </Card>
        </Paper>
    

        <Card
          shadow="sm"
          radius="md"
          withBorder>
          <Stack gap="xs">
            <Title order={2}>Onboarding Ticket</Title>
            <Divider />
            <Anchor href="/onboardingticket">
              <Title order={2}>Click here for Onboarding Tickets</Title>
            </Anchor>
          </Stack>
        </Card>
        <Card
          shadow="sm"
          radius="md"
          withBorder>
          <Stack gap="xs">
            <Title order={2}>Sprint 2 Tickets</Title>
            <Divider />
            <Anchor href="/sprint2">
              <Title order={2}>Click here for Sprint 2 Tickets</Title>
            </Anchor>
          </Stack>
        </Card>

        <Card
          shadow="sm"
          radius="md"
          withBorder>
          <Stack gap="xs">
            <Title order={2}>Sprint 3 (Creative Hot Map) Tickets</Title>
            <Divider />
            <Anchor href="/sprint3">
              <Title order={2}>Click here for Sprint 3 Tickets</Title>
            </Anchor>
          </Stack>
        </Card>

        <Card
          shadow="sm"
          radius="md"
          withBorder>
          <Stack gap="xs">
            <Group>
              <ThemeIcon
                c="teal"
                size="lg"
                radius="md">
                🧭
              </ThemeIcon>
              <Title order={2}>Project structure</Title>
            </Group>
            <Divider />
            <Text
              c="dimmed"
              size="sm">
              <Code>src/app</Code> — routes & layouts
            </Text>
            <Text
              c="dimmed"
              size="sm">
              <Code>src/components</Code> — shared UI components
            </Text>
            <Text
              c="dimmed"
              size="sm">
              <Code>public/</Code> — assets
            </Text>
          </Stack>
        </Card>

        <Card
          shadow="sm"
          radius="md"
          withBorder>
          <Stack gap="xs">
            <Group>
              <ThemeIcon
                c="blue"
                size="lg"
                radius="md">
                ⚙️
              </ThemeIcon>
              <Title order={2}>Developer notes</Title>
            </Group>
            <Divider />
            <List size="sm">
              <List.Item>
                <b>Mantine</b> is a modern React component library used for
                building UI.{" "}
                <Anchor
                  href="https://mantine.dev/"
                  target="_blank"
                  rel="noopener noreferrer">
                  Mantine documentation
                </Anchor>
              </List.Item>
              <List.Item>
                <b>Tailwind CSS</b> is a utility-first CSS framework for rapidly
                building custom designs.{" "}
                <Anchor
                  href="https://tailwindcss.com/docs"
                  target="_blank"
                  rel="noopener noreferrer">
                  Tailwind documentation
                </Anchor>
              </List.Item>
              <List.Item>
                Use Mantine for most UI components and Tailwind for utility
                classes (spacing, colors, etc).
              </List.Item>
              <List.Item>
                For more info, see the{" "}
                <Anchor
                  href="https://github.com/JumboCode/beantown-baby-diaper-bank#readme"
                  target="_blank"
                  rel="noopener noreferrer">
                  project README
                </Anchor>
                .
              </List.Item>
            </List>
          </Stack>
        </Card>

        <Card
          shadow="sm"
          radius="md"
          withBorder>
          <Stack gap="xs">
            <Group>
              <ThemeIcon
                c="orange"
                size="lg"
                radius="md">
                🙋
              </ThemeIcon>
              <Title order={2}>Get help</Title>
            </Group>
            <Divider />
            <Text
              size="sm"
              c="dimmed">
              If you encounter any further setup issues, be sure to reach out to
              Cooper or Dilanur. We encourage you to try to work the onboarding
              ticket yourself using the documentation we provided for Mantine
              and Tailwind, but if you are stuck reach out to Cooper or Dilanur.
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
