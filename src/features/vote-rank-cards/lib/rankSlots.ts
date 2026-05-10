import { compareAsc, isBefore, parseISO } from 'date-fns';

import type { IsoDate, TimeSlotId } from '@/features/vote-rank-cards/lib/types';

export interface SlotCount {
  id: TimeSlotId;
  date: IsoDate;
  slotIndex: number;
  canCount: number;
}

export interface RankedSlotMeta {
  id: TimeSlotId;
  rank: number | null;
  visible: boolean;
}

const MAX_RANK = 5;

export function rankSlots(
  slotCounts: SlotCount[],
  today: IsoDate,
): RankedSlotMeta[] {
  const todayDate = parseISO(today);

  const compareSlot = (a: SlotCount, b: SlotCount): number => {
    const aDate = parseISO(a.date);
    const bDate = parseISO(b.date);
    const aPast = isBefore(aDate, todayDate);
    const bPast = isBefore(bDate, todayDate);

    if (aPast !== bPast) {
      return aPast ? 1 : -1;
    }

    const dateDiff = compareAsc(aDate, bDate);
    if (dateDiff !== 0) return dateDiff;
    return a.slotIndex - b.slotIndex;
  };

  const positiveSlots = slotCounts
    .filter((s) => s.canCount > 0)
    .sort((a, b) => {
      if (b.canCount !== a.canCount) return b.canCount - a.canCount;
      return compareSlot(a, b);
    });

  const zeroSlots = slotCounts
    .filter((s) => s.canCount === 0)
    .sort(compareSlot);

  const positiveResult: RankedSlotMeta[] = [];
  let cursor = 0;
  let denseRank = 0;
  while (cursor < positiveSlots.length) {
    const groupCount = positiveSlots[cursor].canCount;
    denseRank += 1;
    const groupRank = denseRank;
    let groupEnd = cursor;
    while (
      groupEnd < positiveSlots.length &&
      positiveSlots[groupEnd].canCount === groupCount
    ) {
      groupEnd += 1;
    }
    for (let i = cursor; i < groupEnd; i += 1) {
      positiveResult.push({
        id: positiveSlots[i].id,
        rank: groupRank > MAX_RANK ? null : groupRank,
        visible: true,
      });
    }
    cursor = groupEnd;
  }

  const zeroResult: RankedSlotMeta[] = zeroSlots.map((s) => ({
    id: s.id,
    rank: null,
    visible: true,
  }));

  return [...positiveResult, ...zeroResult];
}
