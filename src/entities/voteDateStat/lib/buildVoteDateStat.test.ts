import { describe, expect, it } from 'vitest';

import type { MeetResponse } from '@/entities/meet/dto/meet.dto';
import { buildVoteDateStat } from '@/entities/voteDateStat/lib/buildVoteDateStat';

function makeMeet(overrides?: Partial<MeetResponse>): MeetResponse {
  return {
    id: 'm1',
    title: '테스트',
    dates: ['2026-04-17', '2026-04-18'],
    status: 'VOTING',
    finalizedDate: null,
    maxParticipantCount: 9,
    hostName: '호스트',
    timeRange: null,
    participants: [],
    ...overrides,
  };
}

describe('buildVoteDateStat', () => {
  it('각 date마다 can/cannot 분류', () => {
    const stats = buildVoteDateStat(
      makeMeet({
        dates: ['2026-04-17', '2026-04-18'],
        participants: [
          {
            id: 1,
            name: 'A',
            voteDates: ['2026-04-17'],
            voteTimeSlots: [],
            hasVoted: true,
          },
          {
            id: 2,
            name: 'B',
            voteDates: ['2026-04-18'],
            voteTimeSlots: [],
            hasVoted: true,
          },
        ],
      }),
    );

    expect(stats).toHaveLength(2);
    expect(stats[0]).toEqual({
      date: '2026-04-17',
      can: [{ id: '1', name: 'A' }],
      cannot: [{ id: '2', name: 'B' }],
    });
    expect(stats[1]).toEqual({
      date: '2026-04-18',
      can: [{ id: '2', name: 'B' }],
      cannot: [{ id: '1', name: 'A' }],
    });
  });

  it('hasVoted=false인 참여자는 분류에서 제외', () => {
    const stats = buildVoteDateStat(
      makeMeet({
        dates: ['2026-04-17'],
        participants: [
          {
            id: 1,
            name: '투표함',
            voteDates: ['2026-04-17'],
            voteTimeSlots: [],
            hasVoted: true,
          },
          {
            id: 2,
            name: '투표안함',
            voteDates: [],
            voteTimeSlots: [],
            hasVoted: false,
          },
        ],
      }),
    );

    expect(stats[0].can).toEqual([{ id: '1', name: '투표함' }]);
    expect(stats[0].cannot).toEqual([]);
  });

  it('dates 순서는 server 응답 순서를 그대로 유지', () => {
    // 어댑터는 별도 정렬을 적용하지 않는다 (server 가 정렬 응답한다는 컨벤션 신뢰).
    const stats = buildVoteDateStat(
      makeMeet({ dates: ['2026-04-17', '2026-04-19', '2026-04-20'] }),
    );

    expect(stats.map((s) => s.date)).toEqual([
      '2026-04-17',
      '2026-04-19',
      '2026-04-20',
    ]);
  });

  it('모든 참여자 voteDates=[] - 모든 날짜에서 cannot으로 분류', () => {
    const stats = buildVoteDateStat(
      makeMeet({
        dates: ['2026-04-17'],
        participants: [
          {
            id: 1,
            name: 'A',
            voteDates: [],
            voteTimeSlots: [],
            hasVoted: true,
          },
        ],
      }),
    );

    expect(stats[0].can).toEqual([]);
    expect(stats[0].cannot).toEqual([{ id: '1', name: 'A' }]);
  });

  it('participants 빈 배열', () => {
    const stats = buildVoteDateStat(
      makeMeet({ dates: ['2026-04-17'], participants: [] }),
    );

    expect(stats).toEqual([{ date: '2026-04-17', can: [], cannot: [] }]);
  });
});
