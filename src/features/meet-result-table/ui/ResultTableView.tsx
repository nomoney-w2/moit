'use client';

import { type VoteTimeSlotStat } from '@/entities/voteTimeSlotStat/dto/voteTimeSlotStat.dto';

import { type SelectedCell } from '../model/useSelectedCell';
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
  onSelect: (date: string, slotIdx: number) => void;
  onClose: () => void;
}

export default function ResultTableView({
  slotStat,
  voteCount,
  mode,
  onToggle,
  selected,
  onSelect,
  onClose,
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
          onClose={onClose}
        />
      </div>
    </div>
  );
}
