'use client';

import { useMemo } from 'react';

import { type VoteTimeSlotStat } from '@/entities/voteTimeSlotStat/dto/voteTimeSlotStat.dto';
import { toRankedSlots } from '@/features/vote-rank-cards/lib/toRankedSlots';
import type { MeetingVoteSnapshot } from '@/features/vote-rank-cards/lib/types';
import { useVoteRankCardToggle } from '@/features/vote-rank-cards/model/useVoteRankCardToggle';
import VoteRankCardEmptyState from '@/features/vote-rank-cards/ui/VoteRankCardEmptyState';
import VoteRankCardList from '@/features/vote-rank-cards/ui/VoteRankCardList';

import { useSelectedCell } from '../model/useSelectedCell';
import { useViewMode } from '../model/useViewMode';
import ResultCountBar from './ResultCountBar';
import ResultTableView from './ResultTableView';

interface MeetResultTablePageProps {
  slotStat: VoteTimeSlotStat;
  snapshot: MeetingVoteSnapshot;
}

export default function MeetResultTablePage({
  slotStat,
  snapshot,
}: MeetResultTablePageProps) {
  const { mode, toggle } = useViewMode('table');
  const {
    selected,
    isExpanded,
    position,
    collapsedSide,
    select,
    close,
    collapse,
    expand,
    moveTo,
  } = useSelectedCell();
  const { openIds, toggle: cardToggle } = useVoteRankCardToggle();
  const result = useMemo(() => toRankedSlots(snapshot), [snapshot]);
  const voteCount = result.totalVoters;

  if (mode === 'table') {
    return (
      <ResultTableView
        slotStat={slotStat}
        voteCount={voteCount}
        mode={mode}
        onToggle={toggle}
        selected={selected}
        isExpanded={isExpanded}
        position={position}
        collapsedSide={collapsedSide}
        onSelect={select}
        onClose={close}
        onCollapse={collapse}
        onExpand={expand}
        onMoveTo={moveTo}
      />
    );
  }

  return (
    <>
      <ResultCountBar voteCount={voteCount} mode={mode} onToggle={toggle} />
      <section className='px-5 py-4'>
        {result.isEmpty ? (
          <VoteRankCardEmptyState />
        ) : (
          <VoteRankCardList
            result={result}
            openIds={openIds}
            onToggle={cardToggle}
          />
        )}
      </section>
    </>
  );
}
