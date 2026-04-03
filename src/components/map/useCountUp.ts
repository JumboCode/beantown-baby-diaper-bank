import { useEffect, useState } from "react";

export function useCountUp(target?: number, duration = 1400) {
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (target == null) {
            setValue(0);
            return;
        }

        const startValue = value;
        const delta = target - startValue;

        if (delta === 0) {
            return;
        }

        const startTime = performance.now();
        let frameId = 0;

        const tick = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(startValue + delta * eased));

            if (progress < 1) {
                frameId = window.requestAnimationFrame(tick);
            }
        };

        frameId = window.requestAnimationFrame(tick);

        return () => window.cancelAnimationFrame(frameId);
    }, [target, duration]);

    return value;
}