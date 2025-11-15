import PartnerTable from "@/components/admin/PartnerTable";
import { Card, Group, Stack, Text, Title, Box } from "@mantine/core";

export default function Page() {
  return (
    <Stack gap="lg">
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

      <Card
        radius="lg"
        withBorder
        shadow="xs"
        p="lg">
        <Stack gap="lg">
          <Card
            radius="lg"
            withBorder
            p="md">
            <Box h={"120vh"}>
              <PartnerTable />
            </Box>
          </Card>
        </Stack>
      </Card>
    </Stack>
  );
}
