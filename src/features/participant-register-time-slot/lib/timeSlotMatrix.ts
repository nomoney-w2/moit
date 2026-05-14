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
