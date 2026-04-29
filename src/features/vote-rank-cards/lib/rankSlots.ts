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
const MAX_VISIBLE_ON_FULL_TIE = 5;

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

  const uniqueCounts = Array.from(
    new Set(positiveSlots.map((s) => s.canCount)),
  );
  const isAllTie = uniqueCounts.length === 1 && positiveSlots.length > 0;

  if (isAllTie && positiveSlots.length > MAX_VISIBLE_ON_FULL_TIE) {
    const visibleSet = new Set(
      positiveSlots.slice(0, MAX_VISIBLE_ON_FULL_TIE).map((s) => s.id),
    );
    const visiblePositive: RankedSlotMeta[] = positiveSlots.map((s) => ({
      id: s.id,
      rank: visibleSet.has(s.id) ? 1 : null,
      visible: visibleSet.has(s.id),
    }));
    const hiddenZero: RankedSlotMeta[] = zeroSlots.map((s) => ({
      id: s.id,
      rank: null,
      visible: false,
    }));
    return [...visiblePositive, ...hiddenZero];
  }

  const positiveResult: RankedSlotMeta[] = [];
  let cursor = 0;
  while (cursor < positiveSlots.length) {
    const groupCount = positiveSlots[cursor].canCount;
    const groupRank = cursor + 1;
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
