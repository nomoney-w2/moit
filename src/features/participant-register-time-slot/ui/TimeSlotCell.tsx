'use client';

interface TimeSlotCellProps {
  dateIndex: number;
  slotIndex: number;
  isSelected: boolean;
  height: number;
}

// 입력 화면 BASE 톤 (시안 기준): 결과 페이지의 4% opacity 보다 진하게.
// 시안에서 1시간 박스 rounded-[10px] 윤곽이 명확히 보이는 정도.
const INPUT_BASE_TONE = 'bg-[#F1F5FB]';

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
}: TimeSlotCellProps) {
  const colorClass = isSelected ? 'bg-[#3C7EFA]' : INPUT_BASE_TONE;

  return (
    <button
      type='button'
      role='gridcell'
      tabIndex={-1}
      data-date-index={dateIndex}
      data-slot-index={slotIndex}
      aria-selected={isSelected}
      style={{ height }}
      className={`box-border w-full cursor-pointer select-none ${colorClass}`}
    />
  );
}
