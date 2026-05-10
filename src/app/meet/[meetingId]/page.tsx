import { HTTPError } from 'ky';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getMeetingById } from '@/entities/meet/api/getMeetingById';
import { type MeetResponse } from '@/entities/meet/dto/meet.dto';
import { toMeetingVoteSnapshot } from '@/entities/meet/lib/toMeetingVoteSnapshot';
import { buildVoteDateStat } from '@/entities/voteDateStat/lib/buildVoteDateStat';
import { buildVoteTimeSlotStat } from '@/entities/voteTimeSlotStat/lib/buildVoteTimeSlotStat';
import MeetResultTablePage from '@/features/meet-result-table/ui/MeetResultTablePage';
import type { MeetingVoteSnapshot } from '@/features/vote-rank-cards/lib/types';
import { BASE_URL } from '@/shared/config/constants';
import { END_HOUR, START_HOUR, TOTAL_SLOTS } from '@/shared/config/timeSlot';
import { Header } from '@/shared/ui/header/Header';
import { VoteResultDataView } from '@/widgets/vote-result/ui/VoteResultDataView';

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

/**
 * @deprecated [#73, 2026-05-07] 백엔드 API 연동으로 mock 시드 기반 snapshot 생성 불필요.
 * Replacement: `toMeetingVoteSnapshot` (entities/meet/lib/) + `buildVoteTimeSlotStat` (entities/voteTimeSlotStat/lib/)
 * Removal target: 별도 정리 PR (specs/feat/073-vote-rank-cards-api/plan.md TODO-9 참조).
 *
 * 아래의 `hashSeed`, `mulberry32`, `VISUAL_POOL_SIZE`, `VISUAL_NAMES`, `buildMockSnapshot` 모두 운영 코드 경로에서 호출 0개. 보존만.
 */
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

/**
 * @deprecated [#73, 2026-05-07] mock 시드 snapshot 생성기.
 * Replacement: `toMeetingVoteSnapshot` (entities/meet/lib/)
 * Removal target: 별도 정리 PR.
 */
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

  let meetingData: MeetResponse;
  try {
    meetingData = await getMeetingById(meetingId);
  } catch (e) {
    // 진짜 404 (모임 없음) 만 notFound() 처리.
    // zod 검증 실패·5xx·네트워크 오류는 그대로 throw해서 error.tsx 가 reset CTA를 노출하도록 함.
    if (e instanceof HTTPError && e.response.status === 404) {
      notFound();
    }
    throw e;
  }

  const hasTimeRange = Boolean(meetingData.timeRange);

  if (hasTimeRange) {
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
          slotStat={buildVoteTimeSlotStat(meetingData)}
          snapshot={toMeetingVoteSnapshot(meetingData)}
        />

        <VoteActionButtons meetingId={meetingId} />
      </div>
    );
  }

  // timeRange 없는 모임 → 2026-04-29 이전 화면 형태 그대로 복원
  // (Header + VoteResultDataView 조립, bg-gray-50)
  const sortedDates = [...meetingData.dates].sort();
  const openRange = {
    start: sortedDates[0],
    end: sortedDates[sortedDates.length - 1],
  };
  const participantNames = meetingData.participants.map((p) => p.name);
  const koreaTime = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }),
  );
  const standardTime = `${koreaTime.getHours().toString().padStart(2, '0')}:${koreaTime.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className='min-h-screen-safe flex flex-col bg-gray-50 pt-14 pb-25'>
      <div className='fixed top-0 right-0 left-0 z-50 mx-auto w-full max-w-screen-sm bg-white'>
        <ParticipantHeader
          title={`${meetingData.hostName}님이 초대한 ${meetingData.title}`}
          url={`${BASE_URL}/meet/${meetingId}`}
          className='bg-white'
        />
      </div>

      <Header
        voteCount={meetingData.participants.length}
        standardTime={standardTime}
      />

      <VoteResultDataView
        participantNames={participantNames}
        openRange={openRange}
        stats={buildVoteDateStat(meetingData)}
      />

      <VoteActionButtons meetingId={meetingId} />
    </div>
  );
}
