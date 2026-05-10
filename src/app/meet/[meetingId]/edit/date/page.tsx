import { type Metadata } from 'next';

import { getMeetingById } from '@/entities/meet/api/getMeetingById';
import ParticipantEditDatePage from '@/features/participant-edit-date/ui/ParticipantEditDatePage';
import ParticipantEditTimeSlotPage from '@/features/participant-register-time-slot/ui/ParticipantEditTimeSlotPage';

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
    title: `일정 수정하기 - ${meetingId}`,
  };
}

export default async function Page({ params }: PageProps) {
  const { meetingId } = await params;

  // timeRange 유무로 입력 UI 분기 (register/date 와 동일 정책)
  let hasTimeRange = false;
  try {
    const meeting = await getMeetingById(meetingId);
    hasTimeRange = Boolean(meeting.timeRange);
  } catch {
    // fetch 실패 시 캘린더로 fallback.
  }

  return hasTimeRange ? (
    <ParticipantEditTimeSlotPage meetingId={meetingId} />
  ) : (
    <ParticipantEditDatePage meetingId={meetingId} />
  );
}
