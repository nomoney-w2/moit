import { Metadata } from 'next';

import { getMeetingById } from '@/entities/meet/api/getMeetingById';
import { type Participant } from '@/entities/meet/dto/meet.dto';
import { generateMockVoteTimeSlotStat } from '@/entities/voteTimeSlotStat/lib/mock';
import MeetResultTablePage from '@/features/meet-result-table/ui/MeetResultTablePage';
import { BASE_URL } from '@/shared/config/constants';
import { Person } from '@/shared/types/common';

import ParticipantHeader from './ParticipantHeader';
import { VoteActionButtons } from './VoteActionButtons';

interface PageProps {
  params: Promise<{
    meetingId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { meetingId } = await params;

  try {
    const meetingData = await getMeetingById(meetingId);
    const title = `${meetingData.hostName}님이 초대한 ${meetingData.title}`;
    const description = 'moit | 모두의 만남을 잇다, 모잇';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: ['/opengraph-image.png'],
      },
    };
  } catch {
    const title = 'moit | 모두의 만남을 잇다, 모잇';
    const description = '모잇으로 모임 일정을 쉽게 빠르게 조율해보세요';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: ['/opengraph-image.png'],
      },
    };
  }
}

// Transform Logic
function getStatsFromParticipants(
  candidateDates: string[],
  participants: Participant[],
) {
  // 투표한 참여자만 필터링
  const votedParticipants = participants.filter((p) => p.hasVoted);

  return candidateDates.map((date) => {
    const can: Person[] = [];
    const cannot: Person[] = [];

    votedParticipants.forEach((p) => {
      if (p.voteDates.includes(date)) {
        can.push({ id: String(p.id), name: p.name });
      } else {
        cannot.push({ id: String(p.id), name: p.name });
      }
    });

    return {
      date,
      can,
      cannot,
    };
  });
}

export default async function ResultPage({ params }: PageProps) {
  const { meetingId } = await params;
  const meetingData = await getMeetingById(meetingId);
  const stats = getStatsFromParticipants(
    meetingData.dates,
    meetingData.participants,
  );

  const sortedDates = [...meetingData.dates].sort();
  const openRange = {
    start: sortedDates[0],
    end: sortedDates[sortedDates.length - 1],
  };

  const participantNames = meetingData.participants.map((p) => p.name);
  const voteCount = meetingData.participants.filter((p) => p.hasVoted).length;

  const slotStat = generateMockVoteTimeSlotStat(meetingId, sortedDates);

  return (
    <div className='min-h-screen-safe flex flex-col bg-white pt-14 pb-25'>
      <div className='fixed top-0 right-0 left-0 z-50 mx-auto w-full max-w-screen-sm bg-white'>
        <ParticipantHeader
          title={`${meetingData.hostName}님이 초대한 ${meetingData.title}`}
          url={`${BASE_URL}/meet/${meetingId}`}
          className='bg-white'
        />
      </div>

      <MeetResultTablePage
        slotStat={slotStat}
        voteCount={voteCount}
        participantNames={participantNames}
        openRange={openRange}
        dateStats={stats}
      />

      <VoteActionButtons meetingId={meetingId} />
    </div>
  );
}
