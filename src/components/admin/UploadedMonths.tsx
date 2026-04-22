import { MONTHS } from "@/lib/types";
import { Paper, Text, Group, Badge, Stack, Tooltip } from "@mantine/core";

export interface UploadedMonthsProps {
  currentYear: number;
  uploadedMonthSet: Set<number>;
}

export default function UploadedMonths({ currentYear, uploadedMonthSet }: UploadedMonthsProps) {
  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      style={{
        borderColor: "var(--mantine-color-gray-3)",
        backgroundColor: "var(--mantine-color-gray-0)",
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Text fw={700} size="sm">
            Uploaded months in {currentYear}
          </Text>
        </Group>

        <Group gap="xs" wrap="wrap">
          {MONTHS.map((month, index) => {
            const isUploaded = uploadedMonthSet.has(index);

            return (
              <Tooltip
                key={month}
                label={
                  isUploaded
                    ? `There is data for ${month}`
                    : "There is no data for this month. Consider uploading a dataset below"
                }
                withArrow
                multiline
                maw={300}
              >
                <Badge
                  variant={isUploaded ? "light" : "subtle"}
                  color={isUploaded ? "green" : "gray.5"}
                  size="md"
                  style={{
                    textTransform: "none",
                    fontWeight: isUploaded ? 700 : 500,
                    opacity: isUploaded ? 1 : 0.6,
                  }}
                >
                  {month}
                </Badge>
              </Tooltip>
            );
          })}
        </Group>
      </Stack>
    </Paper>
  );
}
