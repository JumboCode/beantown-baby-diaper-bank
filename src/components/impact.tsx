import { useState } from 'react';
import { Switch } from '@mantine/core';

function Demo() {
    // Create a state to track the current view 
    // view - current value/view (starts with "monthly")
    // setView - a function to update view
    const [view, setView] = useState("monthly");
    // Create a state to track the switch's status
    // checked - current status, true or false (starts with false)
    // setChecked - a function to update checked
    const [checked, setChecked] = useState(false)
    
    // Create a function that defines what happens when the switch is toggled
    function handleChange(event: any) {
        // Store the NEW checked state from the switch
        const isChecked = event.currentTarget.checked;
        // Update checked variable, using setChecked, to isChecked
        setChecked(isChecked);  
        // Update view using setView (if true, set to "yearly", if false, set to "monthly")
        setView(isChecked ? "yearly" : "monthly");
    }

    return (
    <div className="flex flex-col gap-3 justify-center items-center">
        <Switch
            checked={checked}
            color="red"
            onChange={handleChange}
        />
        <img
        src={view === "yearly" ? "/funnyPictures/yearly.jpg" : "/funnyPictures/monthly.jpg"}
        alt={view === "yearly" ? "Yearly funny pic" : "Monthly funny pic"}
        />
    </div>
  );
}

export default Demo;