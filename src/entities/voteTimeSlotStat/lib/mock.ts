import { TOTAL_SLOTS } from '@/shared/config/timeSlot';

import {
  type TimeSlotCell,
  type VoteTimeSlotStat,
} from '../dto/voteTimeSlotStat.dto';

type Person = { id: number; name: string };

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

// 실 API 도입 전까지 5단계 농도가 항상 잘 보이도록 9명짜리 가상 풀로 분포 생성.
// 실제 모임 참여자가 1~2명이어도 화면에서 그라데이션이 잘 살아남.
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
 * @deprecated [#73, 2026-05-07] mock 시드 기반 시간대 집계 생성기. 운영 라우트는 `buildVoteTimeSlotStat` 사용.
 * Replacement: `buildVoteTimeSlotStat` (entities/voteTimeSlotStat/lib/) — `MeetResponse` 입력으로 실 데이터 집계.
 * Removal target: 별도 정리 PR (specs/feat/073-vote-rank-cards-api/plan.md TODO-9 참조).
 */
export function generateMockVoteTimeSlotStat(
  meetingId: string,
  dates: string[],
): VoteTimeSlotStat {
  const rand = mulberry32(hashSeed(meetingId));
  const cells: TimeSlotCell[] = [];

  // 가상 풀 9명을 항상 사용. 각 참여자에게 개별 가용성 비율(10~40%) 부여.
  const pool: Person[] = Array.from({ length: VISUAL_POOL_SIZE }, (_, i) => ({
    id: i + 1,
    name: VISUAL_NAMES[i] ?? `참여자${i + 1}`,
  }));
  const availabilities = pool.map(() => 0.1 + rand() * 0.3);

  for (const date of dates) {
    for (let slotIdx = 0; slotIdx < TOTAL_SLOTS; slotIdx++) {
      const slotParticipants = pool.filter(
        (_, i) => rand() < availabilities[i],
      );
      cells.push({
        date,
        slotIdx,
        count: slotParticipants.length,
        participants: slotParticipants,
      });
    }
  }

  return { meetingId, dates, cells, allParticipants: pool };
}
