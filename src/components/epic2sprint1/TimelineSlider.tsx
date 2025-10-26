import { Slider } from "@mantine/core";

export default function TimelineSlider({
  value,
  setValue,
}: {
  value: number;
  setValue: (value: number) => void;
    }) {
    
  return (
    //   TODO: Edit the Slider component to match the desired functionality outlined in ticket.
    <Slider
      restrictToMarks
      min={0}
      max={10}
      defaultValue={0}
      value={value}
      onChange={setValue}
    />
  );
}
