'use client';

import { isSameWeek } from 'date-fns';
import { useMemo } from 'react';

import { type TimeRangeWithSlotCount } from '@/entities/meet/dto/meet.dto';
import {
  type TimeSlotCell,
  type VoteTimeSlotStat,
} from '@/entities/voteTimeSlotStat/dto/voteTimeSlotStat.dto';
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
// 인접 컬럼이 서로 다른 ISO 주(월~일) 에 속할 때 일반 갭 위에 추가로 더하는 마진.
// 시안 (Figma 3627:6155) 기준 토 → 월 같이 주가 바뀌는 경계에 시각 단서를 준다.
const WEEK_GAP_EXTRA = 12;
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

function timeToMinutes(t: string): number {
  const [hh, mm] = t.split(':').map(Number);
  return hh * 60 + mm;
}

interface HeatmapGridProps {
  slotStat: VoteTimeSlotStat;
  timeRange: TimeRangeWithSlotCount;
  selected: { date: string; slotIdx: number } | null;
  onSelect: (date: string, slotIdx: number) => void;
}

export default function HeatmapGrid({
  slotStat,
  timeRange,
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

  // timeRange 의 startTime ~ endTime 만 표시.
  // 1시간 = 2 슬롯 그룹. 시작이 30분 오프셋이면 첫 그룹은 botSlot 만.
  const startMin = timeToMinutes(timeRange.startTime);
  const startHour = Math.floor(startMin / 60);
  const startHasHalfOffset = startMin % 60 === 30;
  const endMin = timeToMinutes(timeRange.endTime);
  const endHour = Math.ceil(endMin / 60);

  const groups: Array<{
    hour: number;
    topSlotIdx: number | null;
    botSlotIdx: number | null;
  }> = [];
  {
    let cursor = 0;
    if (startHasHalfOffset) {
      groups.push({ hour: startHour, topSlotIdx: null, botSlotIdx: cursor });
      cursor += 1;
    }
    for (
      let h = startHasHalfOffset ? startHour + 1 : startHour;
      h < endHour;
      h += 1
    ) {
      const top = cursor;
      const bot = cursor + 1;
      groups.push({
        hour: h,
        topSlotIdx: top,
        botSlotIdx: bot < timeRange.slotCount ? bot : null,
      });
      cursor += 2;
    }
  }

  return (
    <div
      role='grid'
      aria-rowcount={timeRange.slotCount + 1}
      aria-colcount={slotStat.dates.length + 1}
      className='flex w-full overflow-auto pb-5'
    >
      <div
        className='sticky left-0 z-20 shrink-0 bg-white'
        style={{ width: TIME_COL_W }}
      >
        <div style={{ height: DAY_HEADER_H }} />
        <div className='flex flex-col' style={{ gap: ROW_GAP }}>
          {groups.map((group) => {
            const visibleSlots =
              (group.topSlotIdx !== null ? 1 : 0) +
              (group.botSlotIdx !== null ? 1 : 0);
            const rowHeight = visibleSlots === 1 ? SLOT_H : HOUR_H;
            return (
              <div
                key={group.hour}
                role='rowheader'
                style={{ height: rowHeight }}
                className='text-text-tertiary flex items-start justify-end pr-2 text-[14px] leading-5 font-medium'
              >
                {String(group.hour).padStart(2, '0')}
              </div>
            );
          })}
        </div>
      </div>

      <div className='flex' style={{ gap: COL_GAP }}>
        {slotStat.dates.map((date, dateIndex) => {
          const { weekday, md } = formatDateHeader(date);
          const dow = parseDate(date).getDay();
          const isSunday = dow === 0;
          const isSaturday = dow === 6;
          const prevDate = dateIndex > 0 ? slotStat.dates[dateIndex - 1] : null;
          const isWeekChange =
            prevDate !== null &&
            !isSameWeek(parseDate(prevDate), parseDate(date), {
              weekStartsOn: 1,
            });

          return (
            <div
              key={date}
              className='shrink-0'
              style={{
                width: COL_W,
                marginLeft: isWeekChange ? WEEK_GAP_EXTRA : undefined,
              }}
            >
              <div
                role='columnheader'
                style={{ height: DAY_HEADER_H }}
                className='sticky top-0 z-10 flex flex-col items-center justify-center gap-1 bg-white'
              >
                <span
                  className={`text-[12px] font-semibold ${
                    isSunday
                      ? 'text-red-400'
                      : isSaturday
                        ? 'text-blue-60'
                        : 'text-text-tertiary'
                  }`}
                >
                  {weekday}
                </span>
                <span className='text-text-secondary text-[14px] font-semibold'>
                  {md}
                </span>
              </div>

              <div className='flex flex-col' style={{ gap: ROW_GAP }}>
                {groups.map((group) => {
                  const topSlotIdx = group.topSlotIdx;
                  const botSlotIdx = group.botSlotIdx;
                  const hasTop = topSlotIdx !== null;
                  const hasBot = botSlotIdx !== null;
                  const visibleSlots = (hasTop ? 1 : 0) + (hasBot ? 1 : 0);
                  const rowHeight = visibleSlots === 1 ? SLOT_H : HOUR_H;

                  const topKey = hasTop ? cellKey(date, topSlotIdx) : null;
                  const botKey = hasBot ? cellKey(date, botSlotIdx) : null;
                  const topCell = topKey ? cellByKey.get(topKey) : undefined;
                  const botCell = botKey ? cellByKey.get(botKey) : undefined;
                  const topIntensity =
                    topKey !== null ? (intensityMap.get(topKey) ?? null) : null;
                  const botIntensity =
                    botKey !== null ? (intensityMap.get(botKey) ?? null) : null;

                  return (
                    <div
                      key={`${date}-${group.hour}`}
                      role='row'
                      className='rounded-dropdown relative flex flex-col overflow-hidden'
                      style={{ height: rowHeight }}
                    >
                      {hasTop && (
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
                      )}
                      {hasBot && (
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
                      )}
                      {hasTop && hasBot && (
                        // absolute 로 띄워 flow 영향 0. 두 셀 사이 정확히 가운데에 점선.
                        // 점선 색은 시안 #E6E8EB (≈ border-gray-200) — 셀 색(BASE/intensity) 무관 항상 회색.
                        <div
                          aria-hidden
                          className='pointer-events-none absolute right-0 left-0 border-t border-dashed border-gray-200'
                          style={{
                            top: SLOT_H,
                            opacity: botIntensity !== null ? 1 : 0,
                          }}
                        />
                      )}
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
