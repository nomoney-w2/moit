import { type TimeSlotCell } from '@/entities/voteTimeSlotStat/dto/voteTimeSlotStat.dto';

import { cellKey } from './slotKey';
import { OPACITY_LEVELS, type OpacityLevel } from './timeSlotConstants';

export type HeatmapIntensityMap = Map<string, OpacityLevel | null>;

export function computeHeatmapIntensity(
  cells: TimeSlotCell[],
): HeatmapIntensityMap {
  const result: HeatmapIntensityMap = new Map();

  const distinctCounts = [
    ...new Set(cells.filter((c) => c.count > 0).map((c) => c.count)),
  ].sort((a, b) => b - a);

  for (const cell of cells) {
    const key = cellKey(cell.date, cell.slotIdx);
    if (cell.count <= 0) {
      result.set(key, null);
      continue;
    }
    const rank = distinctCounts.indexOf(cell.count);
    if (rank >= 0 && rank < OPACITY_LEVELS.length) {
      result.set(key, OPACITY_LEVELS[rank]);
    } else {
      result.set(key, null);
    }
  }

  return result;
}
