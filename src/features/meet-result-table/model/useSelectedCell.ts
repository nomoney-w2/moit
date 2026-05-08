'use client';

import { useCallback, useState } from 'react';

export type SelectedCell = { date: string; slotIdx: number } | null;

export function useSelectedCell() {
  const [selected, setSelected] = useState<SelectedCell>(null);

  const select = useCallback((date: string, slotIdx: number) => {
    setSelected((prev) => {
      if (prev && prev.date === date && prev.slotIdx === slotIdx) {
        return null;
      }
      return { date, slotIdx };
    });
  }, []);

  const close = useCallback(() => {
    setSelected(null);
  }, []);

  return {
    selected,
    select,
    close,
  };
}
