'use client';

import { useCallback, useState } from 'react';

import type { TimeSlotId } from '@/features/vote-rank-cards/lib/types';

interface UseVoteRankCardToggleResult {
  openIds: Set<TimeSlotId>;
  isOpen: (id: TimeSlotId) => boolean;
  toggle: (id: TimeSlotId) => void;
}

export function useVoteRankCardToggle(): UseVoteRankCardToggleResult {
  const [openIds, setOpenIds] = useState<Set<TimeSlotId>>(() => new Set());

  const toggle = useCallback((id: TimeSlotId) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isOpen = useCallback((id: TimeSlotId) => openIds.has(id), [openIds]);

  return { openIds, isOpen, toggle };
}
