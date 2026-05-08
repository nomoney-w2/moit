import { END_HOUR, SLOTS_PER_HOUR, START_HOUR } from '@/shared/config/timeSlot';

import {
  BASE_TONE_CLASS,
  OPACITY_CLASS_MAP,
  type OpacityLevel,
} from '../lib/timeSlotConstants';

interface HeatmapCellProps {
  date: string;
  slotIdx: number;
  intensity: OpacityLevel | null;
  count: number;
  height: number;
  onSelect: (date: string, slotIdx: number) => void;
  isSelected: boolean;
}

function formatSlotTime(slotIdx: number): string {
  const totalMinutes = START_HOUR * 60 + slotIdx * (60 / SLOTS_PER_HOUR);
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  if (hour >= END_HOUR) return '';
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

export default function HeatmapCell({
  date,
  slotIdx,
  intensity,
  count,
  height,
  onSelect,
  isSelected,
}: HeatmapCellProps) {
  const colorClass =
    intensity !== null ? OPACITY_CLASS_MAP[intensity] : BASE_TONE_CLASS;
  const time = formatSlotTime(slotIdx);

  return (
    <button
      type='button'
      role='gridcell'
      aria-label={`${date} ${time}: 가능한 사람 ${count}명`}
      aria-selected={isSelected}
      data-date={date}
      data-slot-idx={slotIdx}
      onClick={() => onSelect(date, slotIdx)}
      style={{ height }}
      className={`box-border w-full cursor-pointer ${colorClass}`}
    />
  );
}
