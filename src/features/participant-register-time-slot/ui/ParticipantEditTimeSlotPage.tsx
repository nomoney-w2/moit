'use client';

import { useParticipantEditTimeSlot } from '@/features/participant-register-time-slot/model/useParticipantEditTimeSlot';
import TimeSlotGrid from '@/features/participant-register-time-slot/ui/TimeSlotGrid';
import { trackEvent } from '@/shared/lib/amplitude';
import SuccessBottomSheet from '@/shared/ui/bottom-sheet/SuccessBottomSheet';
import Button from '@/shared/ui/button/Button';
import Checkbox from '@/shared/ui/checkbox/Checkbox';
import { Header } from '@/shared/ui/header/Header';
import TopBar from '@/shared/ui/top-bar/TopBar';

interface ParticipantEditTimeSlotPageProps {
  meetingId: string;
}

export default function ParticipantEditTimeSlotPage({
  meetingId,
}: ParticipantEditTimeSlotPageProps) {
  const {
    isLoading,
    dates,
    timeRange,
    isAllImpossible,
    isCtaActive,
    isSelected,
    onCellTap,
    handleAllImpossibleChange,
    handleBack,
    handleSubmit,
    isSuccessModalOpen,
    handleSuccessModalClose,
  } = useParticipantEditTimeSlot(meetingId);

  const handleSubmitWithTracking = () => {
    trackEvent('voter_vote_edit_completed_cta_click');
    handleSubmit();
  };

  const handleSuccessModalCloseWithTracking = () => {
    trackEvent('voter_vote_completed_cta_click');
    handleSuccessModalClose();
  };

  if (isLoading || !timeRange) {
    return (
      <div className='min-h-screen-safe flex items-center justify-center bg-white'>
        <div className='text-gray-500'>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className='bg-gray-0 min-h-screen-safe mx-auto flex w-full max-w-screen-sm flex-col'>
      <TopBar
        title='일정 수정하기'
        leftIcon='arrow_prev'
        onLeftClick={handleBack}
      />
      <Header variant='subHeader' title={'가능한 시간을\n다시 선택해주세요'} />

      <main className='flex flex-1 flex-col pt-1 pb-10'>
        <div className='@container relative flex-1'>
          <TimeSlotGrid
            dates={dates}
            timeRange={timeRange}
            isSelected={isSelected}
            onCellTap={onCellTap}
          />
        </div>

        <div className='mt-6 mb-6 px-5'>
          <div
            className='flex cursor-pointer items-center gap-2'
            onClick={() => handleAllImpossibleChange(!isAllImpossible)}
          >
            <Checkbox checked={isAllImpossible} onChange={() => {}} />
            <span className='text-body-4 text-text-secondary select-none'>
              모든 날짜에 참여가 어려워요
            </span>
          </div>
        </div>

        <div className='px-5'>
          <Button
            onClick={handleSubmitWithTracking}
            disabled={!isCtaActive}
            fullWidth
          >
            수정하기
          </Button>
        </div>
      </main>

      <SuccessBottomSheet
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessModalCloseWithTracking}
        onConfirm={handleSuccessModalCloseWithTracking}
        title={'투표가 수정되었어요!'}
        subtitle={'지금 투표 현황을 확인해보세요'}
      />
    </div>
  );
}
