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

  return (
    <button
      type='button'
      role='gridcell'
      aria-label={`${date} 슬롯 ${slotIdx}: 가능한 사람 ${count}명`}
      aria-selected={isSelected}
      data-date={date}
      data-slot-idx={slotIdx}
      onClick={() => onSelect(date, slotIdx)}
      style={{ height }}
      className={`box-border w-full cursor-pointer ${colorClass}`}
    />
  );
}
