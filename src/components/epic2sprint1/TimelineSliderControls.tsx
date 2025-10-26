import { useState } from "react";
import TimelineSlider from "./TimelineSlider";

export default function TimelineSliderControls() {
  // Define state for the slider value and pass it to TimelineSlider
  // this pattern allows the controls you create here to modify the slider
  // state
  const [value, setValue] = useState(0);
  return (
    <>
      {/* Example of how you could implement the buttons to control the slider */}
      {/* TODO: Implement the buttons to control the slider */}
      {/* <LeftButton onClick={() => setValue(value - 1)} /> */}
      <TimelineSlider
        value={value}
        setValue={setValue}
      />
      {/* <RightButton onClick={() => setValue(value + 1)} /> */}
    </>
  );
}
