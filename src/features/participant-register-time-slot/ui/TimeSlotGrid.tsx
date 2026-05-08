'use client';

import { type TimeRangeWithSlotCount } from '@/entities/meet/dto/meet.dto';
import TimeSlotCell from '@/features/participant-register-time-slot/ui/TimeSlotCell';
import { parseDate } from '@/shared/lib/date';

const SLOT_H = 40;
const HOUR_H = SLOT_H * 2;
const TIME_COL_W = 40;
const DAY_HEADER_H = 56;
const COL_GAP = 4;
const ROW_GAP = 4;
const GRID_PADDING_X = 20;
// 컬럼 가시성 분기:
// - 5개 이상: 4.5 컬럼만 노출 (우측 컷오프로 더 있음을 시사) — PR #71 결과 표와 동일
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
  beginDrag: (dateIndex: number, slotIndex: number) => void;
  updateDrag: (dateIndex: number, slotIndex: number) => void;
  endDrag: () => void;
}

function timeToMinutes(t: string): number {
  const [hh, mm] = t.split(':').map(Number);
  return hh * 60 + mm;
}

export default function TimeSlotGrid({
  dates,
  timeRange,
  isSelected,
  beginDrag,
  updateDrag,
  endDrag,
}: TimeSlotGridProps) {
  // timeRange 의 startTime ~ endTime 만 표시.
  // 1시간 = 2 슬롯 그룹으로 묶음 (PR #71 결과 표와 동일 layout).
  const startMin = timeToMinutes(timeRange.startTime);
  const startHour = Math.floor(startMin / 60);
  const startHasHalfOffset = startMin % 60 === 30;

  // 표시할 정시(hour) 라벨 — 시작 시각이 30분이면 그 다음 정시부터.
  const endMin = timeToMinutes(timeRange.endTime);
  const endHour = Math.ceil(endMin / 60);

  // 한 시간 단위로 그룹핑한 [topSlotIdx, botSlotIdx, hourLabel] 목록
  // 시작이 30분 오프셋이면 첫 그룹은 한 슬롯만.
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
      className='flex w-full overflow-auto px-5 pb-5'
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <div
        className='sticky left-0 z-20 shrink-0 bg-white'
        style={{ width: TIME_COL_W }}
      >
        <div style={{ height: DAY_HEADER_H }} />
        <div className='flex flex-col' style={{ gap: ROW_GAP }}>
          {groups.map((group) => (
            <div
              key={group.hour}
              role='rowheader'
              style={{ height: HOUR_H }}
              className='text-text-tertiary flex items-start justify-end pr-2 text-[14px] leading-5 font-medium'
            >
              {group.hour}
            </div>
          ))}
        </div>
      </div>

      <div className='flex' style={{ gap: COL_GAP }}>
        {dates.map((date, dateIndex) => {
          const { weekday, md } = formatDateHeader(date);
          const dow = parseDate(date).getDay();
          const isWeekend = dow === 0 || dow === 6;

          return (
            <div key={date} className='shrink-0' style={{ width: colWidth }}>
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
                {groups.map((group) => (
                  <div
                    key={`${date}-${group.hour}`}
                    role='row'
                    className='overflow-hidden rounded-[10px]'
                    style={{ height: HOUR_H }}
                  >
                    {group.topSlotIdx !== null ? (
                      <TimeSlotCell
                        dateIndex={dateIndex}
                        slotIndex={group.topSlotIdx}
                        isSelected={isSelected(dateIndex, group.topSlotIdx)}
                        height={SLOT_H}
                        onPointerDown={beginDrag}
                        onPointerEnter={updateDrag}
                      />
                    ) : (
                      <div style={{ height: SLOT_H }} />
                    )}
                    <div
                      className='border-t border-dashed border-white/40'
                      style={{ marginTop: -1 }}
                    />
                    {group.botSlotIdx !== null ? (
                      <TimeSlotCell
                        dateIndex={dateIndex}
                        slotIndex={group.botSlotIdx}
                        isSelected={isSelected(dateIndex, group.botSlotIdx)}
                        height={SLOT_H}
                        onPointerDown={beginDrag}
                        onPointerEnter={updateDrag}
                      />
                    ) : (
                      <div style={{ height: SLOT_H }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
