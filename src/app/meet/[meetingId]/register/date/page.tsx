import { type Metadata } from 'next';

import { getMeetingById } from '@/entities/meet/api/getMeetingById';
import ParticipantRegisterDatePage from '@/features/participant-register-date/ui/ParticipantRegisterDatePage';
import ParticipantRegisterTimeSlotPage from '@/features/participant-register-time-slot/ui/ParticipantRegisterTimeSlotPage';

interface PageProps {
  params: Promise<{
    meetingId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { meetingId } = await params;
  return {
    title: `일정 선택하기 - ${meetingId}`,
  };
}

export default async function Page({ params }: PageProps) {
  const { meetingId } = await params;

  // timeRange 유무로 입력 UI 분기:
  // - 시간 모임 → 30분 슬롯 그리드 (드래그 선택)
  // - 날짜 모임 → 캘린더 (4-29 이전 형태)
  let hasTimeRange = false;
  try {
    const meeting = await getMeetingById(meetingId);
    hasTimeRange = Boolean(meeting.timeRange);
  } catch {
    // fetch 실패 시 캘린더로 fallback. 클라이언트 컴포넌트에서 다시 fetch + 에러 처리.
  }

  return hasTimeRange ? (
    <ParticipantRegisterTimeSlotPage meetingId={meetingId} />
  ) : (
    <ParticipantRegisterDatePage meetingId={meetingId} />
  );
}
