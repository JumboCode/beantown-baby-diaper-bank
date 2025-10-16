import { useState } from 'react';
import { Switch, Group, Text } from '@mantine/core';
import Image from 'next/image';

function Demo() {
    // Create a state to track the current view 
    // view - current value/view (starts with "monthly")
    // setView - a function to update view
    const [view, setView] = useState("monthly");
    // Create a state to track the switch's status
    // checked - current status, true or false (starts with false)
    // setChecked - a function to update checked
    const [checked, setChecked] = useState(false)
    const [monthlyColor, setMonthlyColor] = useState("#138D8A")
    const [yearlyColor, setYearlyColor] = useState("#344054")
    // Create a function that defines what happens when the switch is toggled
    function handleChange(event: any) {
        // Store the NEW checked state from the switch
        const isChecked = event.currentTarget.checked;
        // Update checked variable, using setChecked, to isChecked
        setChecked(isChecked);  
        // Update view using setView (if true, set to "yearly", if false, set to "monthly")
        setView(isChecked ? "yearly" : "monthly");
        setMonthlyColor(isChecked ? "#344054" : "#138D8A")
        setYearlyColor(isChecked ? "#138D8A" : "#344054")
    }

    return (
    <div className="flex flex-col gap-3 justify-center items-center">
        <Group gap="md" wrap="nowrap">
            <Text c={monthlyColor} size="lg">Monthly</Text>
            <Switch
            styles={{
                track: {
                    backgroundColor: '#E4E7EC',
                },
                thumb: {
                    backgroundColor: '#138D8A',
                }
            }}
            size="xl"
            checked={checked}
            color="#E4E7EC"
            onChange={handleChange}
            />
            <Text c={yearlyColor} size="lg">Yearly</Text>
        </Group>
        <img
        src={view === "yearly" ? "/funnyPictures/yearly.jpg" : "/funnyPictures/monthly.jpg"}
        alt={view === "yearly" ? "Yearly funny pic" : "Monthly funny pic"}
        />
    </div>
  );
}

export default Demo;