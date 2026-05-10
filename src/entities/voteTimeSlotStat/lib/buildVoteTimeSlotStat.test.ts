import { describe, expect, it } from 'vitest';

import type { MeetResponse } from '@/entities/meet/dto/meet.dto';
import { buildVoteTimeSlotStat } from '@/entities/voteTimeSlotStat/lib/buildVoteTimeSlotStat';

function makeMeet(overrides?: Partial<MeetResponse>): MeetResponse {
  return {
    id: 'm1',
    title: '테스트',
    dates: ['2026-04-17', '2026-04-18'],
    status: 'VOTING',
    finalizedDate: null,
    maxParticipantCount: 9,
    hostName: '호스트',
    timeRange: { startTime: '12:00', endTime: '13:00', slotCount: 2 },
    participants: [],
    ...overrides,
  };
}

describe('buildVoteTimeSlotStat', () => {
  it('cells 개수 = dates × slotCount', () => {
    const stat = buildVoteTimeSlotStat(
      makeMeet({
        dates: ['2026-04-17', '2026-04-18', '2026-04-19'],
        timeRange: { startTime: '12:00', endTime: '14:00', slotCount: 4 },
      }),
    );

    expect(stat.cells).toHaveLength(12); // 3 × 4
  });

  it('hasVoted=false인 참여자는 집계·allParticipants에서 제외', () => {
    const meet = makeMeet({
      participants: [
        {
          id: 1,
          name: '투표함',
          voteDates: ['2026-04-17'],
          voteTimeSlots: [
            [true, false],
            [false, false],
          ],
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
    });

    const stat = buildVoteTimeSlotStat(meet);

    const cell0 = stat.cells.find(
      (c) => c.date === '2026-04-17' && c.slotIdx === 0,
    );
    expect(cell0?.count).toBe(1);
    expect(cell0?.participants).toEqual([{ id: 1, name: '투표함' }]);
    expect(stat.allParticipants).toEqual([{ id: 1, name: '투표함' }]);
  });

  it('모든 셀 0표 - participants 빈 배열', () => {
    const stat = buildVoteTimeSlotStat(makeMeet({ participants: [] }));

    expect(stat.cells.every((c) => c.count === 0)).toBe(true);
    expect(stat.allParticipants).toEqual([]);
  });

  it('slotCount=1 단일 셀', () => {
    const stat = buildVoteTimeSlotStat(
      makeMeet({
        dates: ['2026-04-17'],
        timeRange: { startTime: '12:00', endTime: '12:30', slotCount: 1 },
        participants: [
          {
            id: 1,
            name: 'A',
            voteDates: ['2026-04-17'],
            voteTimeSlots: [[true]],
            hasVoted: true,
          },
        ],
      }),
    );

    expect(stat.cells).toHaveLength(1);
    expect(stat.cells[0]).toEqual({
      date: '2026-04-17',
      slotIdx: 0,
      count: 1,
      participants: [{ id: 1, name: 'A' }],
    });
  });

  it('timeRange null → throw', () => {
    expect(() => buildVoteTimeSlotStat(makeMeet({ timeRange: null }))).toThrow(
      /timeRange is required/,
    );
  });

  it('voteTimeSlots 차원이 부족한 참여자도 안전 처리', () => {
    const stat = buildVoteTimeSlotStat(
      makeMeet({
        timeRange: { startTime: '12:00', endTime: '13:00', slotCount: 2 },
        participants: [
          {
            id: 1,
            name: 'A',
            voteDates: ['2026-04-17'],
            voteTimeSlots: [[true]], // 차원 mismatch
            hasVoted: true,
          },
        ],
      }),
    );

    expect(stat.cells.find((c) => c.slotIdx === 0)?.count).toBe(1);
    expect(stat.cells.find((c) => c.slotIdx === 1)?.count).toBe(0);
  });

  it('cells 의 date 와 voteTimeSlots row 매핑은 server 응답 순서를 그대로 유지', () => {
    // 어댑터는 dates 순서를 변경하지 않는다.
    // (server 가 정렬된 dates 를 응답한다는 컨벤션 신뢰)
    const stat = buildVoteTimeSlotStat(
      makeMeet({
        dates: ['2026-04-17', '2026-04-18'],
        timeRange: { startTime: '12:00', endTime: '13:00', slotCount: 2 },
        participants: [
          {
            id: 1,
            name: 'A',
            voteDates: ['2026-04-17'],
            voteTimeSlots: [
              [true, false], // 04-17
              [false, true], // 04-18
            ],
            hasVoted: true,
          },
        ],
      }),
    );

    expect(stat.dates).toEqual(['2026-04-17', '2026-04-18']);
    expect(
      stat.cells.find((c) => c.date === '2026-04-17' && c.slotIdx === 0)?.count,
    ).toBe(1);
    expect(
      stat.cells.find((c) => c.date === '2026-04-18' && c.slotIdx === 1)?.count,
    ).toBe(1);
  });
});
