'use client';

import { type VoteResultsProps } from '@/entities/voteDateStat/dto/voteDateStat.dto';
import { type VoteTimeSlotStat } from '@/entities/voteTimeSlotStat/dto/voteTimeSlotStat.dto';
import { VoteResultDataView } from '@/widgets/vote-result/ui/VoteResultDataView';

import { useSelectedCell } from '../model/useSelectedCell';
import { useViewMode } from '../model/useViewMode';
import ResultCountBar from './ResultCountBar';
import ResultTableView from './ResultTableView';

interface MeetResultTablePageProps {
  slotStat: VoteTimeSlotStat;
  voteCount: number;
  participantNames: string[];
  openRange: { start: string; end: string };
  dateStats: VoteResultsProps['stats'];
  hasVoted?: boolean;
}

export default function MeetResultTablePage({
  slotStat,
  voteCount,
  participantNames,
  openRange,
  dateStats,
  hasVoted = false,
}: MeetResultTablePageProps) {
  const { mode, toggle } = useViewMode('table');
  const {
    selected,
    isExpanded,
    position,
    select,
    close,
    collapse,
    expand,
    moveTo,
  } = useSelectedCell();

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
      <VoteResultDataView
        participantNames={participantNames}
        openRange={openRange}
        stats={dateStats}
        hasVoted={hasVoted}
      />
    </>
  );
}
