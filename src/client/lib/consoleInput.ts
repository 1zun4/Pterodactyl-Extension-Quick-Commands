import { useEffect, useState } from 'react';

const INPUT = 'input[aria-label="Console command input."]';

/** A node directly below the panel's console input (the panel has no slot there), or null while there is no input. */
export function useSpotBelowConsoleInput(): HTMLElement | null {
    const [spot] = useState(() => document.createElement('div'));
    const [placed, setPlaced] = useState(false);

    useEffect(() => {
        const place = () => {
            const row = document.querySelector(INPUT)?.parentElement;

            if (!row) {
                spot.remove();
            } else if (row.nextSibling !== spot) {
                row.after(spot);
            }

            setPlaced(Boolean(row));
        };

        place();
        const observer = new MutationObserver(place);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            spot.remove();
        };
    }, [spot]);

    return placed ? spot : null;
}
