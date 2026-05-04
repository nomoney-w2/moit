'use client';

import { useMemo } from 'react';

import {
  type TimeSlotCell,
  type VoteTimeSlotStat,
} from '@/entities/voteTimeSlotStat/dto/voteTimeSlotStat.dto';
import { END_HOUR, START_HOUR, TOTAL_SLOTS } from '@/shared/config/timeSlot';
import { parseDate } from '@/shared/lib/date';

import { computeHeatmapIntensity } from '../lib/computeHeatmapIntensity';
import { cellKey } from '../lib/slotKey';
import HeatmapCell from './HeatmapCell';

const SLOT_H = 32;
const HOUR_H = SLOT_H * 2;
const TIME_COL_W = 40;
const DAY_HEADER_H = 56;
const COL_GAP = 4;
const ROW_GAP = 4;
const GRID_PADDING_X = 20; // must match px-5 on grid wrapper
const VISIBLE_COLS = 4.5; // 4 full + 0.5 cutoff cue (FR-021)
const VISIBLE_GAPS = 4; // gaps between the visible columns
const COL_W = `calc((100cqi - ${GRID_PADDING_X * 2 + TIME_COL_W + COL_GAP * VISIBLE_GAPS}px) / ${VISIBLE_COLS})`;

const WEEK_KO = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateHeader(dateStr: string): { weekday: string; md: string } {
  const d = parseDate(dateStr);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return { weekday: WEEK_KO[d.getDay()], md: `${month}.${day}` };
}

interface HeatmapGridProps {
  slotStat: VoteTimeSlotStat;
  selected: { date: string; slotIdx: number } | null;
  onSelect: (date: string, slotIdx: number) => void;
}

export default function HeatmapGrid({
  slotStat,
  selected,
  onSelect,
}: HeatmapGridProps) {
  const intensityMap = useMemo(
    () => computeHeatmapIntensity(slotStat.cells),
    [slotStat.cells],
  );

  const cellByKey = useMemo(() => {
    const map = new Map<string, TimeSlotCell>();
    for (const cell of slotStat.cells) {
      map.set(cellKey(cell.date, cell.slotIdx), cell);
    }
    return map;
  }, [slotStat.cells]);

  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i,
  );

  return (
    <div
      role='grid'
      aria-rowcount={TOTAL_SLOTS + 1}
      aria-colcount={slotStat.dates.length + 1}
      className='flex w-full overflow-auto px-5 pb-5'
    >
      <div
        className='sticky left-0 z-20 shrink-0 bg-white'
        style={{ width: TIME_COL_W }}
      >
        <div style={{ height: DAY_HEADER_H }} />
        <div className='flex flex-col' style={{ gap: ROW_GAP }}>
          {hours.map((hour) => (
            <div
              key={hour}
              role='rowheader'
              style={{ height: HOUR_H }}
              className='text-text-tertiary flex items-start justify-end pr-2 text-[14px] leading-5 font-medium'
            >
              {hour}
            </div>
          ))}
        </div>
      </div>

      <div className='flex' style={{ gap: COL_GAP }}>
        {slotStat.dates.map((date) => {
          const { weekday, md } = formatDateHeader(date);
          const dow = parseDate(date).getDay();
          const isWeekend = dow === 0 || dow === 6;

          return (
            <div key={date} className='shrink-0' style={{ width: COL_W }}>
              <div
                role='columnheader'
                style={{ height: DAY_HEADER_H }}
                className='sticky top-0 z-10 flex flex-col items-center justify-center gap-1 bg-white'
              >
                <span
                  className={`text-[12px] font-semibold ${
                    isWeekend ? 'text-red-400' : 'text-text-tertiary'
                  }`}
                >
                  {weekday}
                </span>
                <span className='text-text-secondary text-[14px] font-semibold'>
                  {md}
                </span>
              </div>

              <div className='flex flex-col' style={{ gap: ROW_GAP }}>
                {hours.map((_, hourIdx) => {
                  const topSlotIdx = hourIdx * 2;
                  const botSlotIdx = hourIdx * 2 + 1;
                  const topKey = cellKey(date, topSlotIdx);
                  const botKey = cellKey(date, botSlotIdx);
                  const topCell = cellByKey.get(topKey);
                  const botCell = cellByKey.get(botKey);
                  const topIntensity = intensityMap.get(topKey) ?? null;
                  const botIntensity = intensityMap.get(botKey) ?? null;

                  return (
                    <div
                      key={hourIdx}
                      role='row'
                      className='overflow-hidden rounded-[10px]'
                      style={{ height: HOUR_H }}
                    >
                      <HeatmapCell
                        date={date}
                        slotIdx={topSlotIdx}
                        intensity={topIntensity}
                        count={topCell?.count ?? 0}
                        height={SLOT_H}
                        onSelect={onSelect}
                        isSelected={
                          selected?.date === date &&
                          selected?.slotIdx === topSlotIdx
                        }
                      />
                      <div
                        className='border-t border-dashed border-white/40'
                        style={{
                          marginTop: -1,
                          opacity: botIntensity !== null ? 1 : 0,
                        }}
                      />
                      <HeatmapCell
                        date={date}
                        slotIdx={botSlotIdx}
                        intensity={botIntensity}
                        count={botCell?.count ?? 0}
                        height={SLOT_H}
                        onSelect={onSelect}
                        isSelected={
                          selected?.date === date &&
                          selected?.slotIdx === botSlotIdx
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
