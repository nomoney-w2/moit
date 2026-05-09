'use client';

interface TimeSlotCellProps {
  dateIndex: number;
  slotIndex: number;
  isSelected: boolean;
  height: number;
  /** 모임 timeRange 외 셀은 disabled (클릭/드래그 불가, 더 옅은 톤). */
  disabled?: boolean;
}

// 입력 화면 BASE 톤 (시안 기준): 결과 페이지의 4% opacity 보다 진하게.
// 시안에서 1시간 박스 rounded-[10px] 윤곽이 명확히 보이는 정도.
const INPUT_BASE_TONE = 'bg-[#F1F5FB]';
// timeRange 외 (모임 시간이 아닌 슬롯) 톤 — 더 옅게 + 점선 격자 인상
const DISABLED_TONE = 'bg-gray-50';

/**
 * 시간 슬롯 그리드 셀.
 * pointer 이벤트는 부모 `TimeSlotGrid` 가 elementFromPoint 로 처리한다
 * (셀 별로 setPointerCapture 를 사용하면 origin 셀이 후속 이벤트를 독점해서
 * 다른 셀에 진입해도 드래그가 퍼지지 않는 문제 회피).
 */
export default function TimeSlotCell({
  dateIndex,
  slotIndex,
  isSelected,
  height,
  disabled = false,
}: TimeSlotCellProps) {
  const colorClass = disabled
    ? DISABLED_TONE
    : isSelected
      ? 'bg-[#3C7EFA]'
      : INPUT_BASE_TONE;

  return (
    <button
      type='button'
      role='gridcell'
      tabIndex={-1}
      data-date-index={disabled ? undefined : dateIndex}
      data-slot-index={disabled ? undefined : slotIndex}
      data-disabled={disabled || undefined}
      aria-selected={!disabled && isSelected}
      aria-disabled={disabled || undefined}
      style={{ height }}
      className={`box-border w-full select-none ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      } ${colorClass}`}
    />
  );
}
