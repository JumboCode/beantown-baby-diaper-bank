import { useTimelinePeriod } from "../useTimelinePeriod";
import TimelineSlider from "./TimelineSlider";
import { Group, Stack, ActionIcon } from "@mantine/core";
import YearlyMonthlySwitch from "../sprint2/YearlyMonthlySwitch";
export default function TimelineSliderControls() {
  const { view, index, setIndex, toggleView, move } = useTimelinePeriod();

  return (
    <Stack>
      <h1 style={{ color: "#21325b", fontWeight: 700 }}>Timeline Slider</h1>

      <YearlyMonthlySwitch
        value={view}
        onChange={toggleView}
      />

      <Group align="flex-end">
        <ActionIcon
          color="#053766"
          onClick={() => move(-1)}>
          <img src="/timelineSlider/left.svg" />
        </ActionIcon>

        <div className="flex-1 px-5">
          <TimelineSlider
            monthlyOrYearly={view}
            value={index}
            setValue={setIndex}
          />
        </div>

        <ActionIcon
          color="#053766"
          onClick={() => move(1)}>
          <img src="/timelineSlider/right.svg" />
        </ActionIcon>
      </Group>
    </Stack>
  );
}
