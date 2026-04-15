import { Card, Grid, Skeleton, ScrollArea, Text } from "@mantine/core";

function PartnerRowSkeleton({ avatarWidth }: { avatarWidth: number }) {
  return (
    <div className="border-b border-gray-200 px-6 py-4 last:border-b-0">
      <Grid columns={13} gutter="sm" align="center">
        {/* Partner Name: avatar + name */}
        <Grid.Col span={4}>
          <div className="flex items-center gap-3">
            <Skeleton circle h={40} w={40} />
            <Skeleton h={14} w={avatarWidth} radius="sm" />
          </div>
        </Grid.Col>
        {/* Since */}
        <Grid.Col span={2}>
          <Skeleton h={14} w={80} radius="sm" />
        </Grid.Col>
        {/* Cities Served */}
        <Grid.Col span={2}>
          <Skeleton h={14} w={50} radius="sm" />
        </Grid.Col>
        {/* Babies / Month */}
        <Grid.Col span={2}>
          <Skeleton h={14} w={40} radius="sm" />
        </Grid.Col>
        {/* Status badge */}
        <Grid.Col span={2}>
          <div className="flex justify-center">
            <Skeleton h={22} w={72} radius="xl" />
          </div>
        </Grid.Col>
        {/* Edit icon placeholder */}
        <Grid.Col span={1}>
          <div className="flex justify-end">
            <Skeleton circle h={28} w={28} />
          </div>
        </Grid.Col>
      </Grid>
    </div>
  );
}

// Varying widths make it feel more realistic
const NAME_WIDTHS = [140, 180, 120, 200, 160, 110, 190, 150, 130, 170, 145, 165];

export default function PartnerTableSkeleton() {
  return (
    <Card
      withBorder
      radius="md"
      p={0}
      shadow="sm"
      className="flex flex-col flex-1 border-gray-200 bg-white overflow-hidden"
    >
      {/* Header — mirrors the real table header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 top-0 z-10 sticky">
        <Grid columns={13} gutter="sm" align="center">
          {(
            [
              { span: 4, label: "Partner Name" },
              { span: 2, label: "Since" },
              { span: 2, label: "Cities Served" },
              { span: 2, label: "Babies / Month" },
              { span: 2, label: "Status", center: true },
              { span: 1, label: "" },
            ] as { span: number; label: string; center?: boolean }[]
          ).map(({ span, label, center }) => (
            <Grid.Col key={label} span={span} ta={center ? "center" : undefined}>
              <Text
                size="xs"
                fw={600}
                c="#080b3c"
                tt="uppercase"
                style={{ letterSpacing: "0.05em" }}
              >
                {label}
              </Text>
            </Grid.Col>
          ))}
        </Grid>
      </div>

      <ScrollArea h="68vh">
        {NAME_WIDTHS.map((w, i) => (
          <PartnerRowSkeleton key={i} avatarWidth={w} />
        ))}
      </ScrollArea>
    </Card>
  );
}
