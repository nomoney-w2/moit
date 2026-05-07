import { Metadata } from 'next';

import { getMeetingById } from '@/entities/meet/api/getMeetingById';
import { type MeetResponse } from '@/entities/meet/dto/meet.dto';
import { generateMockVoteTimeSlotStat } from '@/entities/voteTimeSlotStat/lib/mock';
import MeetResultTablePage from '@/features/meet-result-table/ui/MeetResultTablePage';
import type { MeetingVoteSnapshot } from '@/features/vote-rank-cards/lib/types';
import { BASE_URL } from '@/shared/config/constants';
import { END_HOUR, START_HOUR, TOTAL_SLOTS } from '@/shared/config/timeSlot';

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

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VISUAL_POOL_SIZE = 9;
const VISUAL_NAMES = [
  '상민',
  '쭈니',
  '나용짱',
  '윤정',
  '호연왕자',
  '재민누나',
  '예진공주',
  '나용',
  '두쫀쿠',
];

function buildMockSnapshot(meetingData: MeetResponse): MeetingVoteSnapshot {
  const sortedDates = [...meetingData.dates].sort();
  const rand = mulberry32(hashSeed(meetingData.id));
  const availabilities = Array.from(
    { length: VISUAL_POOL_SIZE },
    () => 0.1 + rand() * 0.3,
  );
  const participants = Array.from({ length: VISUAL_POOL_SIZE }, (_, i) => ({
    id: i + 1,
    name: VISUAL_NAMES[i] ?? `참여자${i + 1}`,
    voteDates: sortedDates,
    hasVoted: true,
    voteTimeSlots: sortedDates.map(() =>
      Array.from({ length: TOTAL_SLOTS }, () => rand() < availabilities[i]),
    ),
  }));
  return {
    id: meetingData.id,
    title: meetingData.title,
    dates: sortedDates,
    status: 'VOTING',
    finalizedDate: null,
    maxParticipantCount: meetingData.maxParticipantCount ?? 0,
    hostName: meetingData.hostName,
    timeRange: {
      startTime: `${String(START_HOUR).padStart(2, '0')}:00`,
      endTime: `${String(END_HOUR).padStart(2, '0')}:00`,
      slotCount: TOTAL_SLOTS,
    },
    participants,
  };
}

export default async function ResultPage({ params }: PageProps) {
  const { meetingId } = await params;
  const meetingData = await getMeetingById(meetingId);

  const sortedDates = [...meetingData.dates].sort();
  const slotStat = generateMockVoteTimeSlotStat(meetingId, sortedDates);
  const snapshot = buildMockSnapshot(meetingData);

  return (
    <div className='min-h-screen-safe flex flex-col bg-white pt-14 pb-25'>
      <div className='fixed top-0 right-0 left-0 z-50 mx-auto w-full max-w-screen-sm bg-white'>
        <ParticipantHeader
          title={`${meetingData.hostName}님이 초대한 ${meetingData.title}`}
          url={`${BASE_URL}/meet/${meetingId}`}
          className='bg-white'
        />
      </div>

      <MeetResultTablePage slotStat={slotStat} snapshot={snapshot} />

      <VoteActionButtons meetingId={meetingId} />
    </div>
  );
}
