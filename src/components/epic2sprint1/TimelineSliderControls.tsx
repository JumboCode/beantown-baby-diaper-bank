import { useState } from "react";
import TimelineSlider from "./TimelineSlider";
import {ActionIcon} from "@mantine/core";

export default function TimelineSliderControls() {
  // Define state for the slider value and pass it to TimelineSlider
  // this pattern allows the controls you create here to modify the slider
  // state
  const [value, setValue] = useState(0);

  // onClick function that adjusts the slider value and prevents overflow
  // 1 for right click, -1 for left click
  const moveSlider = (dir:number) => {
    const max = 10;
    const min = 0;

    if (dir > 0) {
      (value == max) ? setValue(value) : setValue(value + dir)
    } else {
      (value == min) ? setValue(value) : setValue(value + dir)
    }
  }

  return (
    <>
      <div className="flex flex-row items-center w-full justify-around">
        <ActionIcon color="#053766" onClick={() => moveSlider(-1)}>
          <img src="/timelineSlider/left.svg"></img>
        </ActionIcon>
        <div className="flex-1 px-5">
          <TimelineSlider
            monthlyOrYearly="monthly"
            value={value}
            setValue={setValue}
          />
        </div>
        <ActionIcon color="#053766" onClick={() => moveSlider(1)}>
          <img src="/timelineSlider/right.svg"></img>
        </ActionIcon>
      </div>
    </>
  );
}
