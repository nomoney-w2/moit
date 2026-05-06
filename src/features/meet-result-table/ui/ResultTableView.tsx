'use client';

import { type VoteTimeSlotStat } from '@/entities/voteTimeSlotStat/dto/voteTimeSlotStat.dto';

import { type CardPosition, type SelectedCell } from '../model/useSelectedCell';
import { type ViewMode } from '../model/useViewMode';
import CellInfoCard from './CellInfoCard';
import HeatmapGrid from './HeatmapGrid';
import ResultCountBar from './ResultCountBar';

interface ResultTableViewProps {
  slotStat: VoteTimeSlotStat;
  voteCount: number;
  mode: ViewMode;
  onToggle: () => void;
  selected: SelectedCell;
  isExpanded: boolean;
  position: CardPosition;
  onSelect: (date: string, slotIdx: number) => void;
  onClose: () => void;
  onCollapse: () => void;
  onExpand: () => void;
  onMoveTo: (next: CardPosition) => void;
}

export default function ResultTableView({
  slotStat,
  voteCount,
  mode,
  onToggle,
  selected,
  isExpanded,
  position,
  onSelect,
  onClose,
  onCollapse,
  onExpand,
  onMoveTo,
}: ResultTableViewProps) {
  return (
    <div className='mx-auto w-full max-w-screen-sm'>
      <ResultCountBar voteCount={voteCount} mode={mode} onToggle={onToggle} />
      <div className='@container relative'>
        <HeatmapGrid
          slotStat={slotStat}
          selected={selected}
          onSelect={onSelect}
        />
        <CellInfoCard
          slotStat={slotStat}
          selected={selected}
          isExpanded={isExpanded}
          position={position}
          onClose={onClose}
          onCollapse={onCollapse}
          onExpand={onExpand}
          onMoveTo={onMoveTo}
        />
      </div>
    </div>
  );
}
