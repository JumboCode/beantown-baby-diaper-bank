import { Switch, Group, Text } from "@mantine/core";

type YearlyMonthlySwitchProps = {
  value: "monthly" | "yearly";
  onChange: (value: "monthly" | "yearly") => void;
};

export default function YearlyMonthlySwitch({
  value,
  onChange,
}: YearlyMonthlySwitchProps) {
  const isChecked = value === "yearly";

  const monthlyColor = isChecked ? "#98A2B3" : "#053766";
  const yearlyColor = isChecked ? "#053766" : "#98A2B3";

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const isChecked = event.currentTarget.checked;
    onChange(isChecked ? "yearly" : "monthly");
  }

  return (
    <Group gap="md">
      <Text c={monthlyColor} size="md" fw={600}>
        Monthly
      </Text>
      <Switch
        styles={{
          track: {
            backgroundColor: "#98A2B3",
          },
          thumb: {
            backgroundColor: "#053766",
          },
        }}
        size="md"
        checked={isChecked}
        color="#98A2B3"
        onChange={handleChange}
      />
      <Text c={yearlyColor} size="md" fw={600}>
        Yearly
      </Text>
    </Group>
  );
}
