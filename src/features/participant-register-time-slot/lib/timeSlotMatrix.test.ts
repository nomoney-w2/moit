import { describe, expect, it } from 'vitest';

import {
  matrixToSelection,
  selectionToMatrix,
  slotKey,
} from '@/features/participant-register-time-slot/lib/timeSlotMatrix';

describe('slotKey', () => {
  it('encodes (dateIndex, slotIndex) as "d:s"', () => {
    expect(slotKey(2, 5)).toBe('2:5');
  });
});

describe('selectionToMatrix', () => {
  it('빈 selection → 모든 false', () => {
    const matrix = selectionToMatrix(new Set(), 2, 3);

    expect(matrix).toEqual([
      [false, false, false],
      [false, false, false],
    ]);
  });

  it('일부 선택된 키 → 해당 위치만 true', () => {
    const matrix = selectionToMatrix(new Set(['0:1', '1:2']), 2, 3);

    expect(matrix).toEqual([
      [false, true, false],
      [false, false, true],
    ]);
  });
});

describe('matrixToSelection', () => {
  it('matrix 의 true 셀만 키로 추출', () => {
    const set = matrixToSelection([
      [false, true, false],
      [true, false, false],
    ]);

    expect(set.has('0:1')).toBe(true);
    expect(set.has('1:0')).toBe(true);
    expect(set.size).toBe(2);
  });
});
