'use client';

interface TimeSlotCellProps {
  dateIndex: number;
  slotIndex: number;
  isSelected: boolean;
  height: number;
  onTap: (dateIndex: number, slotIndex: number) => void;
}

// 시안 (Figma 3617:5634) 기준 BASE 톤 = #F9FAFB (Tailwind gray-50).
// HeatmapCell 의 BASE_TONE_CLASS 와 동일 색 — 결과/입력/수정 일관.
const INPUT_BASE_TONE = 'bg-gray-50';

/**
 * 시간 슬롯 그리드 셀. 탭(클릭) 으로만 선택 — 드래그 다중 선택은 의도적으로 막음.
 * 같은 컬럼에서 두 번 탭하면 사이 구간이 채워지고, 다른 컬럼은 새 단일 선택으로
 * 시작된다. 동작 규칙은 `useTimeSlotSelection` 참고.
 */
export default function TimeSlotCell({
  dateIndex,
  slotIndex,
  isSelected,
  height,
  onTap,
}: TimeSlotCellProps) {
  const colorClass = isSelected ? 'bg-[#3C7EFA]' : INPUT_BASE_TONE;

  return (
    <button
      type='button'
      role='gridcell'
      tabIndex={-1}
      aria-selected={isSelected}
      style={{ height }}
      onClick={() => onTap(dateIndex, slotIndex)}
      className={`box-border w-full cursor-pointer select-none ${colorClass}`}
    />
  );
}
