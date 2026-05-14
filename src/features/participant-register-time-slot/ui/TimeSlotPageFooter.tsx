'use client';

import Button from '@/shared/ui/button/Button';
import Checkbox from '@/shared/ui/checkbox/Checkbox';

interface TimeSlotPageFooterProps {
  isAllImpossible: boolean;
  onAllImpossibleChange: (checked: boolean) => void;
  ctaLabel: string;
  isCtaActive: boolean;
  onCtaClick: () => void;
}

/**
 * 참여자 시간 슬롯 등록/수정 페이지 하단 고정 푸터.
 * `VoteActionButtons` 와 동일한 fixed-bottom 패턴 (sm 폭 컨테이너 중앙 정렬 + 위쪽 흰색 그림자).
 */
export default function TimeSlotPageFooter({
  isAllImpossible,
  onAllImpossibleChange,
  ctaLabel,
  isCtaActive,
  onCtaClick,
}: TimeSlotPageFooterProps) {
  return (
    <div className='fixed right-0 bottom-0 left-0 z-50 mx-auto w-full max-w-screen-sm bg-white px-5 pt-3 pb-4 shadow-[0px_-7px_20px_10px_#ffffff]'>
      <div
        className='mb-3 flex cursor-pointer items-center gap-2'
        onClick={() => onAllImpossibleChange(!isAllImpossible)}
      >
        <Checkbox checked={isAllImpossible} onChange={() => {}} />
        <span className='text-body-4 text-text-secondary select-none'>
          모든 날짜에 참여가 어려워요
        </span>
      </div>
      <Button onClick={onCtaClick} disabled={!isCtaActive} fullWidth>
        {ctaLabel}
      </Button>
    </div>
  );
}
