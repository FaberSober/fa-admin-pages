import { createContext } from 'react';

/** Stable owner key, including while a cached page is hidden. */
export const TabLeaveContext = createContext<string | undefined>(undefined);
