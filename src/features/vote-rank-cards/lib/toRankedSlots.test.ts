import { describe, expect, it } from 'vitest';

import { toRankedSlots } from '@/features/vote-rank-cards/lib/toRankedSlots';
import type {
  MeetingVoteSnapshot,
  ParticipantVote,
} from '@/features/vote-rank-cards/lib/types';

const TODAY = '2026-04-15';

function makeParticipant(
  id: number,
  name: string,
  voteTimeSlots: boolean[][],
  hasVoted = true,
): ParticipantVote {
  return {
    id,
    name,
    voteDates: [],
    voteTimeSlots,
    hasVoted,
  };
}

function emptySlots(dates: number, slots: number): boolean[][] {
  return Array.from({ length: dates }, () =>
    Array.from({ length: slots }, () => false),
  );
}

describe('toRankedSlots', () => {
  it('Figma 시안 시나리오 - 9명 투표, 1위 7명 가능, 1명 불가 매핑', () => {
    const dates = ['2026-04-17'];
    const totalSlots = 1;

    const canNames = [
      '상민',
      '쮸니',
      '나용짱',
      '윤정',
      '호연왕자',
      '재민누나',
      '예진공쥬',
    ];
    const cannotNames = ['냐옹'];
    const unrelated = ['미투표']; // hasVoted=false

    const participants: ParticipantVote[] = [
      ...canNames.map((name, idx) => makeParticipant(idx + 1, name, [[true]])),
      ...cannotNames.map((name, idx) =>
        makeParticipant(canNames.length + idx + 1, name, [[false]]),
      ),
      ...unrelated.map((name, idx) =>
        makeParticipant(99 + idx, name, [[]], false),
      ),
    ];

    const snapshot: MeetingVoteSnapshot = {
      id: 'm1',
      title: '두쫀쿠 투어',
      dates,
      status: 'VOTING',
      finalizedDate: null,
      maxParticipantCount: 9,
      participants,
      hostName: '김야뿌',
      timeRange: {
        startTime: '12:00',
        endTime: '12:30',
        slotCount: totalSlots,
      },
    };

    const result = toRankedSlots(snapshot, { today: TODAY });

    expect(result.totalVoters).toBe(8);
    expect(result.isEmpty).toBe(false);
    expect(result.slots).toHaveLength(1);
    const top = result.slots[0];
    expect(top.rank).toBe(1);
    expect(top.badgeGroup).toBe('rank1');
    expect(top.canCount).toBe(7);
    expect(top.cannotCount).toBe(1);
    expect(top.startTime).toBe('12:00');
    expect(top.endTime).toBe('12:30');
    expect(top.canPeople.map((p) => p.name)).toEqual(canNames);
    expect(top.cannotPeople.map((p) => p.name)).toEqual(cannotNames);
  });

  it('빈 입력 - participants=[] → isEmpty=true, slots=[]', () => {
    const snapshot: MeetingVoteSnapshot = {
      id: 'm2',
      title: '빈 투표',
      dates: ['2026-04-17'],
      status: 'VOTING',
      finalizedDate: null,
      maxParticipantCount: 5,
      participants: [],
      hostName: 'Host',
      timeRange: { startTime: '12:00', endTime: '13:00', slotCount: 2 },
    };

    const result = toRankedSlots(snapshot, { today: TODAY });

    expect(result.isEmpty).toBe(true);
    expect(result.slots).toEqual([]);
    expect(result.totalVoters).toBe(0);
  });

  it('모든 hasVoted=false - isEmpty=true', () => {
    const snapshot: MeetingVoteSnapshot = {
      id: 'm3',
      title: '미투표 모임',
      dates: ['2026-04-17'],
      status: 'VOTING',
      finalizedDate: null,
      maxParticipantCount: 3,
      participants: [
        makeParticipant(1, 'A', emptySlots(1, 2), false),
        makeParticipant(2, 'B', emptySlots(1, 2), false),
      ],
      hostName: 'Host',
      timeRange: { startTime: '12:00', endTime: '13:00', slotCount: 2 },
    };

    const result = toRankedSlots(snapshot, { today: TODAY });

    expect(result.isEmpty).toBe(true);
    expect(result.totalVoters).toBe(0);
  });

  it('전원 동률 7슬롯 - isAllTie=true, slots.length=5', () => {
    const dates = [
      '2026-04-17',
      '2026-04-18',
      '2026-04-19',
      '2026-04-20',
      '2026-04-21',
      '2026-04-22',
      '2026-04-23',
    ];
    const slotCount = 1;

    const participants = [1, 2, 3].map((i) =>
      makeParticipant(
        i,
        `P${i}`,
        Array.from({ length: dates.length }, () => [true]),
      ),
    );

    const snapshot: MeetingVoteSnapshot = {
      id: 'm4',
      title: '전원동률',
      dates,
      status: 'VOTING',
      finalizedDate: null,
      maxParticipantCount: 3,
      participants,
      hostName: 'Host',
      timeRange: { startTime: '12:00', endTime: '12:30', slotCount },
    };

    const result = toRankedSlots(snapshot, { today: TODAY });

    expect(result.isAllTie).toBe(true);
    expect(result.slots).toHaveLength(5);
    expect(result.slots.every((s) => s.rank === 1)).toBe(true);
    expect(result.slots.map((s) => s.date)).toEqual(dates.slice(0, 5));
  });

  it('badgeGroup 매핑 - 1→rank1, 2·3→rank2-3, 4·5→rank4-5, null→none', () => {
    const dates = [
      '2026-04-17',
      '2026-04-18',
      '2026-04-19',
      '2026-04-20',
      '2026-04-21',
      '2026-04-22',
    ];
    const slotCount = 1;

    const yesPerSlotCount = [5, 4, 3, 2, 1, 0];
    const participants: ParticipantVote[] = Array.from(
      { length: 5 },
      (_, voterIdx) => {
        const voteTimeSlots = yesPerSlotCount.map((count) => [
          voterIdx < count,
        ]);
        return makeParticipant(voterIdx + 1, `P${voterIdx + 1}`, voteTimeSlots);
      },
    );

    const snapshot: MeetingVoteSnapshot = {
      id: 'm5',
      title: '뱃지 그룹',
      dates,
      status: 'VOTING',
      finalizedDate: null,
      maxParticipantCount: 5,
      participants,
      hostName: 'Host',
      timeRange: { startTime: '12:00', endTime: '12:30', slotCount },
    };

    const result = toRankedSlots(snapshot, { today: TODAY });

    expect(result.slots).toHaveLength(6);
    expect(result.slots[0].badgeGroup).toBe('rank1');
    expect(result.slots[1].badgeGroup).toBe('rank2-3');
    expect(result.slots[2].badgeGroup).toBe('rank2-3');
    expect(result.slots[3].badgeGroup).toBe('rank4-5');
    expect(result.slots[4].badgeGroup).toBe('rank4-5');
    expect(result.slots[5].badgeGroup).toBe('none');
    expect(result.slots[5].rank).toBeNull();
    expect(result.slots[5].canCount).toBe(0);
  });

  it('슬롯 시간 계산 - 12:00~13:00, slotCount=2 → slot0 12:00-12:30, slot1 12:30-13:00', () => {
    const snapshot: MeetingVoteSnapshot = {
      id: 'm6',
      title: '시간 계산',
      dates: ['2026-04-17'],
      status: 'VOTING',
      finalizedDate: null,
      maxParticipantCount: 1,
      participants: [makeParticipant(1, 'A', [[true, true]])],
      hostName: 'Host',
      timeRange: { startTime: '12:00', endTime: '13:00', slotCount: 2 },
    };

    const result = toRankedSlots(snapshot, { today: TODAY });

    expect(result.slots).toHaveLength(2);
    expect(result.slots[0].startTime).toBe('12:00');
    expect(result.slots[0].endTime).toBe('12:30');
    expect(result.slots[1].startTime).toBe('12:30');
    expect(result.slots[1].endTime).toBe('13:00');
  });
});
