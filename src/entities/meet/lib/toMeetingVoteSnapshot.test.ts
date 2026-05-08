import { describe, expect, it } from 'vitest';

import type { MeetResponse } from '@/entities/meet/dto/meet.dto';
import { toMeetingVoteSnapshot } from '@/entities/meet/lib/toMeetingVoteSnapshot';

function makeMeet(overrides?: Partial<MeetResponse>): MeetResponse {
  return {
    id: 'm1',
    title: '테스트 모임',
    dates: ['2026-04-17', '2026-04-18'],
    status: 'VOTING',
    finalizedDate: null,
    maxParticipantCount: 9,
    hostName: '호스트',
    timeRange: { startTime: '12:00', endTime: '13:00', slotCount: 2 },
    participants: [
      {
        id: 1,
        name: 'A',
        voteDates: ['2026-04-17'],
        voteTimeSlots: [
          [true, false],
          [false, false],
        ],
        hasVoted: true,
      },
    ],
    ...overrides,
  };
}

describe('toMeetingVoteSnapshot', () => {
  it('정상 변환 - timeRange 있는 모임의 모든 필드 매핑', () => {
    const meet = makeMeet();

    const snapshot = toMeetingVoteSnapshot(meet);

    expect(snapshot.id).toBe('m1');
    expect(snapshot.title).toBe('테스트 모임');
    expect(snapshot.dates).toEqual(['2026-04-17', '2026-04-18']);
    expect(snapshot.status).toBe('VOTING');
    expect(snapshot.finalizedDate).toBeNull();
    expect(snapshot.maxParticipantCount).toBe(9);
    expect(snapshot.hostName).toBe('호스트');
    expect(snapshot.timeRange).toEqual({
      startTime: '12:00',
      endTime: '13:00',
      slotCount: 2,
    });
    expect(snapshot.participants).toHaveLength(1);
    expect(snapshot.participants[0].voteTimeSlots).toEqual([
      [true, false],
      [false, false],
    ]);
  });

  it('participants가 빈 배열이어도 안전 변환', () => {
    const snapshot = toMeetingVoteSnapshot(makeMeet({ participants: [] }));

    expect(snapshot.participants).toEqual([]);
  });

  it('voteTimeSlots 차원이 dates × slotCount보다 작으면 false 패딩', () => {
    const meet = makeMeet({
      dates: ['2026-04-17', '2026-04-18'],
      timeRange: { startTime: '12:00', endTime: '14:00', slotCount: 4 },
      participants: [
        {
          id: 1,
          name: 'A',
          voteDates: ['2026-04-17'],
          voteTimeSlots: [[true]], // 1개 row, 1개 slot만
          hasVoted: true,
        },
      ],
    });

    const snapshot = toMeetingVoteSnapshot(meet);

    expect(snapshot.participants[0].voteTimeSlots).toHaveLength(2);
    expect(snapshot.participants[0].voteTimeSlots[0]).toEqual([
      true,
      false,
      false,
      false,
    ]);
    expect(snapshot.participants[0].voteTimeSlots[1]).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  it('finalizedDate가 undefined면 null로 정규화', () => {
    const meet = makeMeet({ finalizedDate: undefined });

    const snapshot = toMeetingVoteSnapshot(meet);

    expect(snapshot.finalizedDate).toBeNull();
  });

  it('strict 모드 + timeRange null → throw', () => {
    expect(() =>
      toMeetingVoteSnapshot(makeMeet({ timeRange: null }), { strict: true }),
    ).toThrow(/timeRange is required/);
  });

  it('strict=false 모드 + timeRange null → fallback timeRange로 변환', () => {
    const snapshot = toMeetingVoteSnapshot(makeMeet({ timeRange: null }), {
      strict: false,
    });

    expect(snapshot.timeRange.slotCount).toBe(0);
  });

  it('dates 와 voteTimeSlots 매핑은 server 응답 순서를 그대로 유지', () => {
    // 어댑터는 dates 순서를 변경하지 않는다 (server 가 정렬 응답한다는 컨벤션 신뢰).
    const snapshot = toMeetingVoteSnapshot(
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

    expect(snapshot.dates).toEqual(['2026-04-17', '2026-04-18']);
    expect(snapshot.participants[0].voteTimeSlots).toEqual([
      [true, false],
      [false, true],
    ]);
  });
});
