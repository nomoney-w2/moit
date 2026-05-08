'use client';

interface TimeSlotCellProps {
  dateIndex: number;
  slotIndex: number;
  isSelected: boolean;
  height: number;
  onPointerDown: (dateIndex: number, slotIndex: number) => void;
  onPointerEnter: (dateIndex: number, slotIndex: number) => void;
}

// 입력 화면 BASE 톤 (시안 기준): 결과 페이지의 4% opacity 보다 진하게.
// 시안에서 1시간 박스 rounded-[10px] 윤곽이 명확히 보이는 정도.
const INPUT_BASE_TONE = 'bg-[#F1F5FB]';

export default function TimeSlotCell({
  dateIndex,
  slotIndex,
  isSelected,
  height,
  onPointerDown,
  onPointerEnter,
}: TimeSlotCellProps) {
  const colorClass = isSelected ? 'bg-[#3C7EFA]' : INPUT_BASE_TONE;

  return (
    <button
      type='button'
      role='gridcell'
      data-date-index={dateIndex}
      data-slot-index={slotIndex}
      aria-selected={isSelected}
      onPointerDown={(e) => {
        e.preventDefault();
        // pointer capture 로 드래그 중 포인터가 다른 셀 위로 이동해도 동일 셀이 이벤트 받음.
        // 일부 환경(synthetic event 등) 에서는 메서드 미지원 — optional chaining 으로 안전 처리.
        e.currentTarget.setPointerCapture?.(e.pointerId);
        onPointerDown(dateIndex, slotIndex);
      }}
      onPointerEnter={() => onPointerEnter(dateIndex, slotIndex)}
      style={{ height }}
      className={`box-border w-full cursor-pointer touch-none select-none ${colorClass}`}
    />
  );
}
