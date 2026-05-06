import { describe, expect, it } from 'vitest';

import { cellKey, parseCellKey } from './slotKey';

describe('cellKey / parseCellKey', () => {
  it('round-trip을 통과한다', () => {
    const date = '2026-04-16';
    for (let i = 0; i < 24; i++) {
      const key = cellKey(date, i);
      const parsed = parseCellKey(key);
      expect(parsed.date).toBe(date);
      expect(parsed.slotIdx).toBe(i);
    }
  });

  it('cellKey는 "{date}_{slotIdx}" 포맷', () => {
    expect(cellKey('2026-04-16', 0)).toBe('2026-04-16_0');
    expect(cellKey('2026-04-16', 23)).toBe('2026-04-16_23');
  });
});
