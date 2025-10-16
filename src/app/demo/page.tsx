"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Divider,
  Group,
  List,
  NumberInput,
  Paper,
  Progress,
  SimpleGrid,
  Slider,
  Stack,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Avatar,
  rem,
  useMantineTheme,
  Switch,
} from "@mantine/core";

const featureCards = [
  {
    title: "Theme-aware styling",
    description:
      "Use tokens, gradients, and responsive utilities to build polished interfaces without leaving TypeScript.",
    badges: ["Tokens", "Gradients", "Responsive"],
  },
  {
    title: "Composable layouts",
    description:
      "Stack, Group, and Grid primitives let you orchestrate complex page structures that adapt across breakpoints.",
    badges: ["Stack", "Group", "Grid"],
  },
  {
    title: "Accessible interactions",
    description:
      "Buttons, tabs, sliders, and switches all ship with sensible defaults and ARIA attributes out of the box.",
    badges: ["ARIA", "Keyboard", "Focus"],
  },
];

const team = [
  { name: "Jamie Rivera", role: "Design Systems Lead", color: "teal" },
  { name: "Marcus Chen", role: "Frontend Engineer", color: "blue" },
  { name: "Priya Mehta", role: "UX Researcher", color: "grape" },
];

export default function Page() {
  const theme = useMantineTheme();
  const primaryShades = theme.colors[theme.primaryColor] ?? theme.colors.teal;

  return (
    <Container
      size="lg"
      py="xl">
      <Stack gap="xl">
        <Paper
          radius="lg"
          p={{ base: "xl", sm: "2xl" }}
          shadow="md"
          style={{
            background: `linear-gradient(135deg, ${primaryShades[6]}, ${primaryShades[3]})`,
          }}>
          <Stack gap="md">
            <Title
              order={1}
              c="white">
              Mantine Playground
            </Title>
            <Text
              c="white"
              size="lg"
              maw={520}>
              Explore a handful of Mantine components working together. The
              theme cascades everywhere: colors, spacing, typography, and
              interactions.
            </Text>
            <Group>
              <Button
                variant="white"
                color="dark"
                size="md">
                Explore components
              </Button>
              <Button
                variant="outline"
                color="white"
                size="md">
                View docs
              </Button>
            </Group>
          </Stack>
        </Paper>

        <Divider
          label="Why Mantine?"
          labelPosition="center"
        />

        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3 }}
          spacing="lg"
          pb="sm">
          {featureCards.map((card) => (
            <Card
              key={card.title}
              radius="md"
              padding="lg"
              shadow="sm"
              withBorder>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Title order={3}>{card.title}</Title>
                  <ThemeIcon
                    color="teal"
                    variant="light"
                    radius="md">
                    {card.title.slice(0, 1)}
                  </ThemeIcon>
                </Group>
                <Text
                  c="dimmed"
                  size="sm">
                  {card.description}
                </Text>
                <Group gap="xs">
                  {card.badges.map((badge) => (
                    <Badge
                      key={badge}
                      color="teal"
                      variant="light">
                      {badge}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        <Paper
          radius="md"
          p="lg"
          withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={2}>Design tokens in action</Title>
              <Badge
                size="lg"
                radius="sm"
                color="teal">
                live theme
              </Badge>
            </Group>
            <Text c="dimmed">
              Typography, spacing, and color utilities pull from the same theme
              object. You can tweak the palette or radius once and the entire
              surface updates.
            </Text>
            <Progress
              value={72}
              color="teal"
              size="lg"
              radius="xl"
            />
            <List
              spacing="sm"
              size="sm"
              center>
              <List.Item
                icon={
                  <ThemeIcon
                    color="teal"
                    radius="xl"
                    size={24}>
                    •
                  </ThemeIcon>
                }>
                Consistent spacing scales ({theme.spacing.md} rem base)
              </List.Item>
              <List.Item
                icon={
                  <ThemeIcon
                    color="teal"
                    radius="xl"
                    size={24}>
                    •
                  </ThemeIcon>
                }>
                Shared border radii ({rem(theme.radius.md)} corners)
              </List.Item>
              <List.Item
                icon={
                  <ThemeIcon
                    color="teal"
                    radius="xl"
                    size={24}>
                    •
                  </ThemeIcon>
                }>
                Dynamic color shades (primary: {theme.primaryColor})
              </List.Item>
            </List>
          </Stack>
        </Paper>

        <Tabs
          defaultValue="overview"
          radius="md"
          variant="outline">
          <Tabs.List>
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="components">Components</Tabs.Tab>
            <Tabs.Tab value="theming">Theming</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel
            value="overview"
            pt="md">
            <Text>
              Tabs combine typographic contrast and focus management. Switch
              between panels without re-rendering the entire page.
            </Text>
          </Tabs.Panel>
          <Tabs.Panel
            value="components"
            pt="md">
            <Text>
              Most Mantine controls share props like `size`, `radius`, and
              `variant`.
            </Text>
          </Tabs.Panel>
          <Tabs.Panel
            value="theming"
            pt="md">
            <Text>
              Customize tokens via `createTheme` and wrap your app with
              `MantineProvider` once. Everything below inherits those decisions.
            </Text>
          </Tabs.Panel>
        </Tabs>

        <Paper
          radius="md"
          p="lg"
          shadow="sm"
          withBorder>
          <Stack gap="lg">
            <Title order={3}>Form controls & inputs</Title>
            <SimpleGrid
              cols={{ base: 1, sm: 2 }}
              spacing="md">
              <TextInput
                label="Organization name"
                placeholder="Beantown Baby Diaper Bank"
                radius="md"
              />
              <NumberInput
                label="Monthly distribution goal"
                placeholder="5000"
                suffix=" diapers"
                radius="md"
              />
            </SimpleGrid>
            <Group
              gap="lg"
              align="flex-start">
              <Box style={{ flex: 1 }}>
                <Slider
                  labelAlwaysOn
                  defaultValue={44}
                  color="teal"
                  marks={[
                    { value: 0, label: "0%" },
                    { value: 50, label: "50%" },
                    { value: 100, label: "100%" },
                  ]}
                />
                <Text
                  size="sm"
                  c="dimmed"
                  mt="sm">
                  Sliders inherit theme spacing, colors, and label typography
                  automatically.
                </Text>
              </Box>
              <Stack gap="sm">
                <Switch
                  label="Enable notifications"
                  defaultChecked
                  color="teal"
                />
                <Checkbox label="Accept terms" />
              </Stack>
            </Group>
          </Stack>
        </Paper>

        <Paper
          radius="md"
          p="lg"
          withBorder>
          <Stack gap="md">
            <Title order={3}>People love working with Mantine</Title>
            <Stack gap="sm">
              {team.map((member) => (
                <Group
                  key={member.name}
                  justify="space-between"
                  gap="md">
                  <Group gap="sm">
                    <Avatar
                      color={member.color}
                      radius="xl">
                      {member.name[0]}
                    </Avatar>
                    <Box>
                      <Text fw={600}>{member.name}</Text>
                      <Text
                        size="sm"
                        c="dimmed">
                        {member.role}
                      </Text>
                    </Box>
                  </Group>
                  <Badge
                    color={member.color}
                    variant="outline">
                    {member.role.includes("Engineer") ? "Builder" : "Design"}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
