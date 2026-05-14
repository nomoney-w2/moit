'use client';

import { useParticipantRegisterTimeSlot } from '@/features/participant-register-time-slot/model/useParticipantRegisterTimeSlot';
import TimeSlotGrid from '@/features/participant-register-time-slot/ui/TimeSlotGrid';
import TimeSlotPageFooter from '@/features/participant-register-time-slot/ui/TimeSlotPageFooter';
import { trackEvent } from '@/shared/lib/amplitude';
import SuccessBottomSheet from '@/shared/ui/bottom-sheet/SuccessBottomSheet';
import { Header } from '@/shared/ui/header/Header';
import TopBar from '@/shared/ui/top-bar/TopBar';

interface ParticipantRegisterTimeSlotPageProps {
  meetingId: string;
}

export default function ParticipantRegisterTimeSlotPage({
  meetingId,
}: ParticipantRegisterTimeSlotPageProps) {
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
  } = useParticipantRegisterTimeSlot(meetingId);

  const handleSubmitWithTracking = () => {
    trackEvent('voter_vote_cta_click');
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
        title='일정 투표하기'
        leftIcon='arrow_prev'
        onLeftClick={handleBack}
      />
      <Header variant='subHeader' title={'가능한 시간을\n모두 선택해주세요'} />

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
        ctaLabel='투표하기'
        isCtaActive={isCtaActive}
        onCtaClick={handleSubmitWithTracking}
      />

      <SuccessBottomSheet
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessModalCloseWithTracking}
        onConfirm={handleSuccessModalCloseWithTracking}
        title={'투표가 완료되었어요!'}
        subtitle={'지금 투표 현황을 확인해보세요'}
      />
    </div>
  );
}
