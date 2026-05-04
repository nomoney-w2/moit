'use client';

import { useCallback, useState } from 'react';

export type ViewMode = 'table' | 'calendar';

export function useViewMode(initial: ViewMode = 'table') {
  const [mode, setMode] = useState<ViewMode>(initial);

  const toggle = useCallback(() => {
    setMode((prev) => (prev === 'table' ? 'calendar' : 'table'));
  }, []);

  return { mode, toggle, setMode };
}
