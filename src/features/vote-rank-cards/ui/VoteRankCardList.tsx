'use client';

import type {
  RankedListResult,
  TimeSlotId,
} from '@/features/vote-rank-cards/lib/types';
import VoteRankCard from '@/features/vote-rank-cards/ui/VoteRankCard';

interface VoteRankCardListProps {
  result: RankedListResult;
  openIds: Set<TimeSlotId>;
  onToggle: (id: TimeSlotId) => void;
}

export default function VoteRankCardList({
  result,
  openIds,
  onToggle,
}: VoteRankCardListProps) {
  return (
    <ul className='flex flex-col gap-3'>
      {result.slots.map((slot) => (
        <VoteRankCard
          key={slot.id}
          slot={slot}
          isOpen={openIds.has(slot.id)}
          onToggle={onToggle}
        />
      ))}
    </ul>
  );
}
