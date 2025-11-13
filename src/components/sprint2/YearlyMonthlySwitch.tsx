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

  const monthlyColor = isChecked ? "#344054" : "#138D8A";
  const yearlyColor = isChecked ? "#138D8A" : "#344054";

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const isChecked = event.currentTarget.checked;
    onChange(isChecked ? "yearly" : "monthly");
  }

  return (
    <div className="flex flex-col gap-3 justify-center items-center">
      <Group gap="md" wrap="nowrap">
        <Text c={monthlyColor} size="lg">
          Monthly
        </Text>
        <Switch
          styles={{
            track: {
              backgroundColor: "#E4E7EC",
            },
            thumb: {
              backgroundColor: "#138D8A",
            },
          }}
          size="xl"
          checked={isChecked}
          color="#E4E7EC"
          onChange={handleChange}
        />
        <Text c={yearlyColor} size="lg">
          Yearly
        </Text>
      </Group>
    </div>
  );
}
