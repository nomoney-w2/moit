/**
 * (dateIndex, slotIndex) 키 인코딩.
 * Set<string> 으로 선택 상태를 보관하기 위한 헬퍼.
 */
export function slotKey(dateIndex: number, slotIndex: number): string {
  return `${dateIndex}:${slotIndex}`;
}

/**
 * Set<slotKey> → boolean[][]
 * 차원: dates.length × slotCount
 */
export function selectionToMatrix(
  selected: Set<string>,
  datesLength: number,
  slotCount: number,
): boolean[][] {
  return Array.from({ length: datesLength }, (_, d) =>
    Array.from({ length: slotCount }, (_, s) => selected.has(slotKey(d, s))),
  );
}

/**
 * boolean[][] → Set<slotKey>
 */
export function matrixToSelection(matrix: boolean[][]): Set<string> {
  const set = new Set<string>();
  for (let d = 0; d < matrix.length; d += 1) {
    const row = matrix[d];
    for (let s = 0; s < row.length; s += 1) {
      if (row[s]) set.add(slotKey(d, s));
    }
  }
  return set;
}

/**
 * 시작 셀 (dateA, slotA) ~ 끝 셀 (dateB, slotB) 사이 직사각형 영역의 키 집합.
 * 같은 dateIndex 컬럼 내에서만 드래그하지만, 안전하게 양방향 처리.
 */
export function rectKeys(
  startDate: number,
  startSlot: number,
  endDate: number,
  endSlot: number,
): string[] {
  const dMin = Math.min(startDate, endDate);
  const dMax = Math.max(startDate, endDate);
  const sMin = Math.min(startSlot, endSlot);
  const sMax = Math.max(startSlot, endSlot);
  const keys: string[] = [];
  for (let d = dMin; d <= dMax; d += 1) {
    for (let s = sMin; s <= sMax; s += 1) {
      keys.push(slotKey(d, s));
    }
  }
  return keys;
}
