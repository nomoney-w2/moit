/**
 * @deprecated [#73, 2026-05-07] 본 파일의 mock fixtures는 운영 라우트(`/meet/[meetingId]`)가 실 API 어댑터(`toMeetingVoteSnapshot`)로 전환되며 운영 사용처 0개.
 * 현재 사용처: `/test/vote-rank-cards`(개발용 라우트), Storybook stories.
 * Removal target: test 라우트와 함께 별도 정리 PR (specs/feat/073-vote-rank-cards-api/plan.md TODO-9 참조).
 */
import type {
  MeetingVoteSnapshot,
  ParticipantVote,
} from '@/features/vote-rank-cards/lib/types';

const FIGMA_DATES = ['2026-04-17', '2026-04-18', '2026-04-19', '2026-04-20'];

const FIGMA_SLOT_COUNT = 4;

interface FigmaParticipantSpec {
  id: number;
  name: string;
  votes: boolean[][];
  hasVoted?: boolean;
}

const FIGMA_PARTICIPANTS: FigmaParticipantSpec[] = [
  {
    id: 1,
    name: '상민',
    votes: [
      [true, true, true, false],
      [true, false, false, false],
      [true, true, false, false],
      [false, false, false, false],
    ],
  },
  {
    id: 2,
    name: '쮸니',
    votes: [
      [true, true, false, true],
      [true, false, true, false],
      [false, false, false, false],
      [true, true, false, false],
    ],
  },
  {
    id: 3,
    name: '나용짱',
    votes: [
      [true, true, true, false],
      [false, true, true, false],
      [true, false, false, false],
      [true, false, false, false],
    ],
  },
  {
    id: 4,
    name: '윤정',
    votes: [
      [true, false, true, false],
      [true, true, false, false],
      [false, true, false, true],
      [false, false, true, false],
    ],
  },
  {
    id: 5,
    name: '호연왕자',
    votes: [
      [true, true, true, true],
      [true, false, false, false],
      [false, false, true, false],
      [false, true, false, false],
    ],
  },
  {
    id: 6,
    name: '재민누나',
    votes: [
      [true, false, false, true],
      [false, true, true, false],
      [true, false, false, false],
      [false, false, false, true],
    ],
  },
  {
    id: 7,
    name: '예진공쥬',
    votes: [
      [true, true, false, false],
      [true, true, false, false],
      [false, false, true, false],
      [false, false, false, false],
    ],
  },
  {
    id: 8,
    name: '냐옹',
    votes: [
      [false, false, true, false],
      [false, true, true, false],
      [true, false, false, false],
      [false, false, true, false],
    ],
  },
  {
    id: 9,
    name: '제이미',
    votes: [
      [true, false, true, false],
      [true, true, false, true],
      [false, true, false, false],
      [false, false, false, true],
    ],
  },
];

function buildFigmaParticipants(): ParticipantVote[] {
  return FIGMA_PARTICIPANTS.map((spec) => ({
    id: spec.id,
    name: spec.name,
    voteDates: FIGMA_DATES,
    voteTimeSlots: spec.votes,
    hasVoted: spec.hasVoted ?? true,
  }));
}

export const mockMeetingVoteSnapshot: MeetingVoteSnapshot = {
  id: 'meet-figma-001',
  title: '두쫀쿠 투어',
  dates: FIGMA_DATES,
  status: 'VOTING',
  finalizedDate: null,
  maxParticipantCount: 9,
  participants: buildFigmaParticipants(),
  hostName: '김야뿌',
  timeRange: {
    startTime: '12:00',
    endTime: '14:00',
    slotCount: FIGMA_SLOT_COUNT,
  },
};

export const mockEmptyMeetingVoteSnapshot: MeetingVoteSnapshot = {
  id: 'meet-empty-001',
  title: '아직 투표가 없어요',
  dates: ['2026-04-17', '2026-04-18'],
  status: 'VOTING',
  finalizedDate: null,
  maxParticipantCount: 6,
  participants: [],
  hostName: '김야뿌',
  timeRange: { startTime: '12:00', endTime: '13:00', slotCount: 2 },
};

const ALL_TIE_DATES = [
  '2026-04-17',
  '2026-04-18',
  '2026-04-19',
  '2026-04-20',
  '2026-04-21',
  '2026-04-22',
  '2026-04-23',
];

export const mockAllTieMeetingVoteSnapshot: MeetingVoteSnapshot = {
  id: 'meet-all-tie-001',
  title: '전원 동률 시나리오',
  dates: ALL_TIE_DATES,
  status: 'VOTING',
  finalizedDate: null,
  maxParticipantCount: 3,
  participants: [
    {
      id: 1,
      name: 'A',
      voteDates: ALL_TIE_DATES,
      voteTimeSlots: ALL_TIE_DATES.map(() => [true]),
      hasVoted: true,
    },
    {
      id: 2,
      name: 'B',
      voteDates: ALL_TIE_DATES,
      voteTimeSlots: ALL_TIE_DATES.map(() => [true]),
      hasVoted: true,
    },
    {
      id: 3,
      name: 'C',
      voteDates: ALL_TIE_DATES,
      voteTimeSlots: ALL_TIE_DATES.map(() => [true]),
      hasVoted: true,
    },
  ],
  hostName: '김야뿌',
  timeRange: { startTime: '12:00', endTime: '12:30', slotCount: 1 },
};
