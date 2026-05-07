import { describe, expect, it } from 'vitest';

import {
  rankSlots,
  type SlotCount,
} from '@/features/vote-rank-cards/lib/rankSlots';

const TODAY = '2026-04-15';

function makeSlot(
  id: string,
  date: string,
  slotIndex: number,
  canCount: number,
): SlotCount {
  return { id, date, slotIndex, canCount };
}

describe('rankSlots', () => {
  it('일반 6슬롯 - canCount 내림차순으로 1~5위 부여 후 6위는 null', () => {
    const slots = [
      makeSlot('a', '2026-04-17', 0, 7),
      makeSlot('b', '2026-04-17', 1, 6),
      makeSlot('c', '2026-04-18', 0, 5),
      makeSlot('d', '2026-04-18', 1, 4),
      makeSlot('e', '2026-04-19', 0, 3),
      makeSlot('f', '2026-04-19', 1, 2),
    ];

    const result = rankSlots(slots, TODAY);

    expect(result.find((r) => r.id === 'a')).toEqual({
      id: 'a',
      rank: 1,
      visible: true,
    });
    expect(result.find((r) => r.id === 'b')?.rank).toBe(2);
    expect(result.find((r) => r.id === 'c')?.rank).toBe(3);
    expect(result.find((r) => r.id === 'd')?.rank).toBe(4);
    expect(result.find((r) => r.id === 'e')?.rank).toBe(5);
    expect(result.find((r) => r.id === 'f')?.rank).toBeNull();
    expect(result.every((r) => r.visible)).toBe(true);
  });

  it('공동 2위 2개 - 다음 슬롯은 4위 (3위 스킵)', () => {
    const slots = [
      makeSlot('a', '2026-04-17', 0, 7),
      makeSlot('b', '2026-04-17', 1, 5),
      makeSlot('c', '2026-04-18', 0, 5),
      makeSlot('d', '2026-04-18', 1, 3),
    ];

    const result = rankSlots(slots, TODAY);

    expect(result.find((r) => r.id === 'a')?.rank).toBe(1);
    expect(result.find((r) => r.id === 'b')?.rank).toBe(2);
    expect(result.find((r) => r.id === 'c')?.rank).toBe(2);
    expect(result.find((r) => r.id === 'd')?.rank).toBe(4);
  });

  it('모든 슬롯 0표 - 전부 rank=null, visible=true', () => {
    const slots = [
      makeSlot('a', '2026-04-17', 0, 0),
      makeSlot('b', '2026-04-18', 0, 0),
      makeSlot('c', '2026-04-19', 0, 0),
    ];

    const result = rankSlots(slots, TODAY);

    expect(result).toHaveLength(3);
    expect(result.every((r) => r.rank === null)).toBe(true);
    expect(result.every((r) => r.visible)).toBe(true);
  });

  it('전원 동률 7슬롯 - 임박한 5장만 visible, rank=1', () => {
    const slots = [
      makeSlot('a', '2026-04-17', 0, 4),
      makeSlot('b', '2026-04-18', 0, 4),
      makeSlot('c', '2026-04-19', 0, 4),
      makeSlot('d', '2026-04-20', 0, 4),
      makeSlot('e', '2026-04-21', 0, 4),
      makeSlot('f', '2026-04-22', 0, 4),
      makeSlot('g', '2026-04-23', 0, 4),
    ];

    const result = rankSlots(slots, TODAY);

    const visibleIds = result.filter((r) => r.visible).map((r) => r.id);
    expect(visibleIds).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(result.filter((r) => r.visible).every((r) => r.rank === 1)).toBe(
      true,
    );
    expect(result.filter((r) => !r.visible).map((r) => r.id)).toEqual([
      'f',
      'g',
    ]);
  });

  it('0표 슬롯 섞인 케이스 - 1표 이상이 먼저 정렬되고 0표는 뒤에 visible=true·rank=null', () => {
    const slots = [
      makeSlot('a', '2026-04-17', 0, 0),
      makeSlot('b', '2026-04-17', 1, 5),
      makeSlot('c', '2026-04-18', 0, 3),
      makeSlot('d', '2026-04-18', 1, 0),
    ];

    const result = rankSlots(slots, TODAY);

    expect(result.map((r) => r.id)).toEqual(['b', 'c', 'a', 'd']);
    expect(result.find((r) => r.id === 'b')?.rank).toBe(1);
    expect(result.find((r) => r.id === 'c')?.rank).toBe(2);
    expect(result.find((r) => r.id === 'a')?.rank).toBeNull();
    expect(result.find((r) => r.id === 'd')?.rank).toBeNull();
    expect(result.find((r) => r.id === 'a')?.visible).toBe(true);
    expect(result.find((r) => r.id === 'd')?.visible).toBe(true);
  });

  it('동률 그룹 내 임박한 미래 날짜 → 같은 날짜 내 이른 시간 우선 정렬', () => {
    const slots = [
      makeSlot('late-19', '2026-04-19', 1, 4),
      makeSlot('early-19', '2026-04-19', 0, 4),
      makeSlot('early-17', '2026-04-17', 0, 4),
      makeSlot('late-17', '2026-04-17', 1, 4),
    ];

    const result = rankSlots(slots, TODAY);

    expect(result.map((r) => r.id)).toEqual([
      'early-17',
      'late-17',
      'early-19',
      'late-19',
    ]);
    expect(result.every((r) => r.rank === 1)).toBe(true);
  });

  it('동률 그룹 내 과거 날짜는 미래 날짜 뒤로 밀림', () => {
    const slots = [
      makeSlot('past', '2026-04-10', 0, 4),
      makeSlot('future', '2026-04-17', 0, 4),
    ];

    const result = rankSlots(slots, TODAY);

    expect(result.map((r) => r.id)).toEqual(['future', 'past']);
    expect(result.every((r) => r.rank === 1)).toBe(true);
  });

  it('5장 정확히 동률 - isAllTie여도 잘라내지 않음', () => {
    const slots = [
      makeSlot('a', '2026-04-17', 0, 3),
      makeSlot('b', '2026-04-18', 0, 3),
      makeSlot('c', '2026-04-19', 0, 3),
      makeSlot('d', '2026-04-20', 0, 3),
      makeSlot('e', '2026-04-21', 0, 3),
    ];

    const result = rankSlots(slots, TODAY);

    expect(result).toHaveLength(5);
    expect(result.every((r) => r.visible && r.rank === 1)).toBe(true);
  });
});
