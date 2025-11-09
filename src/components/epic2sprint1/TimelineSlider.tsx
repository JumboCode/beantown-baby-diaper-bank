import { Slider } from "@mantine/core";

export interface TimelineSliderProps {
  monthlyOrYearly: "monthly" | "yearly";
  value: number;
  setValue: (value: number) => void;
}

/**
 * TimelineSlider component for choosing time periods on a slider.
 * It uses the provided value and setValue callback to manage the current selection.
 *
 * @param monthlyOrYearly - A string indicating whether the slider is in 'monthly' or 'yearly' mode.
 * @param value - The current value of the slider.
 * @param setValue - A callback function to update the slider's value.
 * @returns A JSX element representing the slider component.
 */
export default function TimelineSlider({
  monthlyOrYearly,
  value,
  setValue,
}: TimelineSliderProps) {
  // This value is intended for future use to adjust the slider's behavior
  // based on whether it's in monthly or yearly mode.
  // For now, use monthly or yearly value until implemented.
  void monthlyOrYearly; // REMOVE THIS LINE WHEN USED

  return (
    //   TODO: Edit the Slider component to match the desired functionality outlined in ticket.
    <Slider
      restrictToMarks
      min={0}
      max={10} // Example max value, adjust as needed
      defaultValue={0}
      value={value}
      onChange={setValue}
      color="#053766"
    />
  );
}
