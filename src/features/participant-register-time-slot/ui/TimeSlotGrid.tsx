'use client';

import { isSameWeek } from 'date-fns';

import { type TimeRangeWithSlotCount } from '@/entities/meet/dto/meet.dto';
import TimeSlotCell from '@/features/participant-register-time-slot/ui/TimeSlotCell';
import { parseDate } from '@/shared/lib/date';

// 시안 (Figma 3627:6217) 기준: 셀 32px, 1시간 그룹 64px, corner radius 8px.
const SLOT_H = 32;
const HOUR_H = SLOT_H * 2;
const TIME_COL_W = 40;
const DAY_HEADER_H = 56;
const COL_GAP = 4;
const ROW_GAP = 4;
// 인접 컬럼이 서로 다른 ISO 주(월~일) 에 속할 때 일반 갭 위에 추가로 더하는 마진.
// 시안 (Figma 3627:6155) 기준 토 → 월 같이 주가 바뀌는 경계에 시각 단서를 준다.
const WEEK_GAP_EXTRA = 12;
const GRID_PADDING_X = 20;
// 컬럼 가시성 분기:
// - 5개 이상: 4.5 컬럼만 노출 (우측 컷오프로 더 있음을 시사)
// - 4개 이하: 화면 폭에 균등 분배 (가로 스크롤 없이 모두 보임)
function buildColWidth(dateCount: number): string {
  if (dateCount >= 5) {
    const visibleCols = 4.5;
    const visibleGaps = 4;
    return `calc((100cqi - ${GRID_PADDING_X * 2 + TIME_COL_W + COL_GAP * visibleGaps}px) / ${visibleCols})`;
  }
  const gaps = Math.max(0, dateCount - 1);
  return `calc((100cqi - ${GRID_PADDING_X * 2 + TIME_COL_W + COL_GAP * gaps}px) / ${dateCount})`;
}

const WEEK_KO = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateHeader(dateStr: string): { weekday: string; md: string } {
  const d = parseDate(dateStr);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return { weekday: WEEK_KO[d.getDay()], md: `${month}.${day}` };
}

interface TimeSlotGridProps {
  dates: string[];
  timeRange: TimeRangeWithSlotCount;
  isSelected: (dateIndex: number, slotIndex: number) => boolean;
  onCellTap: (dateIndex: number, slotIndex: number) => void;
}

function timeToMinutes(t: string): number {
  const [hh, mm] = t.split(':').map(Number);
  return hh * 60 + mm;
}

export default function TimeSlotGrid({
  dates,
  timeRange,
  isSelected,
  onCellTap,
}: TimeSlotGridProps) {
  // timeRange 의 startTime ~ endTime 만 표시.
  // 1시간 = 2 슬롯 그룹으로 묶음.
  const startMin = timeToMinutes(timeRange.startTime);
  const startHour = Math.floor(startMin / 60);
  const startHasHalfOffset = startMin % 60 === 30;

  const endMin = timeToMinutes(timeRange.endTime);
  const endHour = Math.ceil(endMin / 60);

  // 시작이 30분 오프셋이면 첫 그룹은 한 슬롯만 (botSlot 만).
  const groups: Array<{
    hour: number;
    topSlotIdx: number | null;
    botSlotIdx: number | null;
  }> = [];
  let cursor = 0;
  if (startHasHalfOffset) {
    groups.push({
      hour: startHour,
      topSlotIdx: null,
      botSlotIdx: cursor,
    });
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

  const colWidth = buildColWidth(dates.length);

  return (
    <div
      role='grid'
      aria-rowcount={timeRange.slotCount + 1}
      aria-colcount={dates.length + 1}
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
                {group.hour}
              </div>
            );
          })}
        </div>
      </div>

      <div className='flex' style={{ gap: COL_GAP }}>
        {dates.map((date, dateIndex) => {
          const { weekday, md } = formatDateHeader(date);
          const dow = parseDate(date).getDay();
          const isSunday = dow === 0;
          const isSaturday = dow === 6;
          const prevDate = dateIndex > 0 ? dates[dateIndex - 1] : null;
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
                width: colWidth,
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
                  const hasTop = group.topSlotIdx !== null;
                  const hasBot = group.botSlotIdx !== null;
                  const visibleSlots = (hasTop ? 1 : 0) + (hasBot ? 1 : 0);
                  const rowHeight = visibleSlots === 1 ? SLOT_H : HOUR_H;

                  return (
                    <div
                      key={`${date}-${group.hour}`}
                      role='row'
                      className='rounded-dropdown relative flex flex-col overflow-hidden'
                      style={{ height: rowHeight }}
                    >
                      {hasTop && (
                        <TimeSlotCell
                          dateIndex={dateIndex}
                          slotIndex={group.topSlotIdx as number}
                          isSelected={isSelected(
                            dateIndex,
                            group.topSlotIdx as number,
                          )}
                          height={SLOT_H}
                          onTap={onCellTap}
                        />
                      )}
                      {hasBot && (
                        <TimeSlotCell
                          dateIndex={dateIndex}
                          slotIndex={group.botSlotIdx as number}
                          isSelected={isSelected(
                            dateIndex,
                            group.botSlotIdx as number,
                          )}
                          height={SLOT_H}
                          onTap={onCellTap}
                        />
                      )}
                      {hasTop && hasBot && (
                        // absolute 로 띄워 flow 영향 0. 두 셀 사이 정확히 가운데에 점선.
                        // 점선 색은 시안 #E6E8EB (≈ border-gray-200) — 셀 색 무관 항상 회색.
                        <div
                          aria-hidden
                          className='pointer-events-none absolute right-0 left-0 border-t border-dashed border-gray-200'
                          style={{ top: SLOT_H }}
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
