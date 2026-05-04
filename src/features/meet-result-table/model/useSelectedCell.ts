'use client';

import { useCallback, useState } from 'react';

export type SelectedCell = { date: string; slotIdx: number } | null;
export type CardPosition = 'top' | 'bottom';

export function useSelectedCell() {
  const [selected, setSelected] = useState<SelectedCell>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [position, setPosition] = useState<CardPosition>('top');

  const select = useCallback((date: string, slotIdx: number) => {
    setSelected((prev) => {
      if (prev && prev.date === date && prev.slotIdx === slotIdx) {
        return null;
      }
      return { date, slotIdx };
    });
    setIsExpanded(true);
  }, []);

  const close = useCallback(() => {
    setSelected(null);
    setIsExpanded(true);
    setPosition('top');
  }, []);

  const collapse = useCallback(() => setIsExpanded(false), []);
  const expand = useCallback(() => setIsExpanded(true), []);
  const moveTo = useCallback((next: CardPosition) => setPosition(next), []);

  return {
    selected,
    isExpanded,
    position,
    select,
    close,
    collapse,
    expand,
    moveTo,
  };
}
