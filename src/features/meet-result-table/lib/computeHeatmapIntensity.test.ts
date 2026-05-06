import { describe, expect, it } from 'vitest';

import { type TimeSlotCell } from '@/entities/voteTimeSlotStat/dto/voteTimeSlotStat.dto';

import { computeHeatmapIntensity } from './computeHeatmapIntensity';
import { cellKey } from './slotKey';

const D = '2026-04-16';

function cell(slotIdx: number, count: number): TimeSlotCell {
  return { date: D, slotIdx, count, participants: [] };
}

describe('computeHeatmapIntensity', () => {
  it('모든 셀이 0명이면 모두 null 농도', () => {
    const cells = Array.from({ length: 5 }, (_, i) => cell(i, 0));
    const result = computeHeatmapIntensity(cells);
    for (const cellItem of cells) {
      expect(result.get(cellKey(cellItem.date, cellItem.slotIdx))).toBeNull();
    }
  });

  it('distinct count 1종이면 그 셀들만 100% 적용', () => {
    const cells = [cell(0, 5), cell(1, 5), cell(2, 5), cell(3, 0)];
    const result = computeHeatmapIntensity(cells);
    expect(result.get(cellKey(D, 0))).toBe(100);
    expect(result.get(cellKey(D, 1))).toBe(100);
    expect(result.get(cellKey(D, 2))).toBe(100);
    expect(result.get(cellKey(D, 3))).toBeNull();
  });

  it('distinct count 5종 정확히 → 100/70/50/30/10 정확히 매핑', () => {
    const cells = [
      cell(0, 9),
      cell(1, 7),
      cell(2, 5),
      cell(3, 3),
      cell(4, 1),
      cell(5, 0),
    ];
    const result = computeHeatmapIntensity(cells);
    expect(result.get(cellKey(D, 0))).toBe(100);
    expect(result.get(cellKey(D, 1))).toBe(70);
    expect(result.get(cellKey(D, 2))).toBe(50);
    expect(result.get(cellKey(D, 3))).toBe(30);
    expect(result.get(cellKey(D, 4))).toBe(10);
    expect(result.get(cellKey(D, 5))).toBeNull();
  });

  it('distinct count 6종 이상이면 6위 이하는 null(베이스)', () => {
    const cells = [
      cell(0, 10),
      cell(1, 9),
      cell(2, 8),
      cell(3, 7),
      cell(4, 6),
      cell(5, 5),
      cell(6, 4),
      cell(7, 0),
    ];
    const result = computeHeatmapIntensity(cells);
    expect(result.get(cellKey(D, 0))).toBe(100);
    expect(result.get(cellKey(D, 4))).toBe(10);
    expect(result.get(cellKey(D, 5))).toBeNull();
    expect(result.get(cellKey(D, 6))).toBeNull();
    expect(result.get(cellKey(D, 7))).toBeNull();
  });

  it('5위 동률 다수 → 모두 같은 농도(10%)로 표시, 컷오프 잘라냄 없음', () => {
    const cells = [
      cell(0, 9),
      cell(1, 7),
      cell(2, 5),
      cell(3, 3),
      cell(4, 1),
      cell(5, 1),
      cell(6, 1),
      cell(7, 1),
    ];
    const result = computeHeatmapIntensity(cells);
    expect(result.get(cellKey(D, 4))).toBe(10);
    expect(result.get(cellKey(D, 5))).toBe(10);
    expect(result.get(cellKey(D, 6))).toBe(10);
    expect(result.get(cellKey(D, 7))).toBe(10);
  });

  it('1위 동률 다수 → 모두 100%, 다음 distinct count는 2위(70%)', () => {
    const cells = [cell(0, 8), cell(1, 8), cell(2, 8), cell(3, 5), cell(4, 3)];
    const result = computeHeatmapIntensity(cells);
    expect(result.get(cellKey(D, 0))).toBe(100);
    expect(result.get(cellKey(D, 1))).toBe(100);
    expect(result.get(cellKey(D, 2))).toBe(100);
    expect(result.get(cellKey(D, 3))).toBe(70);
    expect(result.get(cellKey(D, 4))).toBe(50);
  });
});
