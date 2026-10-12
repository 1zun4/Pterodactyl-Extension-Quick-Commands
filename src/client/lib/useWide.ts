import { useSyncExternalStore } from 'react';

// Tailwind's md breakpoint; without matchMedia (tests) the wide layout is used.
const QUERY = '(min-width: 48rem)';

function subscribe(listener: () => void): () => void {
    const media = window.matchMedia?.(QUERY);
    media?.addEventListener('change', listener);

    return () => media?.removeEventListener('change', listener);
}

const isWide = () => window.matchMedia?.(QUERY).matches ?? true;

/** Whether the window is at least as wide as Tailwind's md breakpoint. */
export const useWide = (): boolean => useSyncExternalStore(subscribe, isWide, () => true);
