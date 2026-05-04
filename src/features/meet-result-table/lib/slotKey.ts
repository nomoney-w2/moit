export function cellKey(date: string, slotIdx: number): string {
  return `${date}_${slotIdx}`;
}

export function parseCellKey(key: string): { date: string; slotIdx: number } {
  const [date, slotIdxStr] = key.split('_');
  return { date, slotIdx: Number(slotIdxStr) };
}
