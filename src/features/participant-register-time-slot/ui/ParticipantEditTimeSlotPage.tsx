'use client';

import { useParticipantEditTimeSlot } from '@/features/participant-register-time-slot/model/useParticipantEditTimeSlot';
import TimeSlotGrid from '@/features/participant-register-time-slot/ui/TimeSlotGrid';
import TimeSlotPageFooter from '@/features/participant-register-time-slot/ui/TimeSlotPageFooter';
import { trackEvent } from '@/shared/lib/amplitude';
import SuccessBottomSheet from '@/shared/ui/bottom-sheet/SuccessBottomSheet';
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

      <main className='flex flex-1 flex-col pt-1 pb-36'>
        <div className='@container relative flex-1'>
          <TimeSlotGrid
            dates={dates}
            timeRange={timeRange}
            isSelected={isSelected}
            onCellTap={onCellTap}
          />
        </div>
      </main>

      <TimeSlotPageFooter
        isAllImpossible={isAllImpossible}
        onAllImpossibleChange={handleAllImpossibleChange}
        ctaLabel='수정하기'
        isCtaActive={isCtaActive}
        onCtaClick={handleSubmitWithTracking}
      />

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
