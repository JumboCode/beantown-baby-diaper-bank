import React from "react";
import { useState } from "react";
import { Slider } from "@mantine/core";

export default function ourSlider() {
    const [value, setValue] = useState(0);

    const images = [
        '/funnypictures/cat1.png',
        '/funnypictures/cat2.png',
        '/funnypictures/cat3.png',
        '/funnypictures/cat4.png',
        '/funnypictures/cat5.png',
        '/funnypictures/cat6.png',
        '/funnypictures/cat7.png',
        '/funnypictures/cat8.png',
        '/funnypictures/cat9.png',
        '/funnypictures/cat10.png',
    ]
    return (
        <>
            <div className="flex flex-col items-center justify-center">
                <img src={images[value]} alt={`Funny picture ${value}`} className="mb-5 w-auto h-100" />
            </div>
            <Slider
                restrictToMarks
                min={0}
                max={9}
                defaultValue={0}
                marks={Array.from({ length: 10 }).map((_, index) => ({
                    value: index,
                }))}
                value={value}
                onChange={setValue}
            />

        </>

    );
}
