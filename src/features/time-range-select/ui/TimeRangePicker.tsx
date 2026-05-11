'use client';

import { useEffect, useState } from 'react';

import BottomSheet from '@/shared/ui/bottom-sheet/BottomSheet';
import Button from '@/shared/ui/button/Button';
import Toggle from '@/shared/ui/toggle/Toggle';

import { isValidTimeRange, timeToMinutes } from '../lib/timeUtils';
import type { TimeValue } from '../model/types';
import { useTimeRangeSelect } from '../model/useTimeRangeSelect';
import TimeWheelPicker from './TimeWheelPicker';

const DEFAULT_START_TIME: TimeValue = { hour: 9, minute: 0 };
const DEFAULT_END_TIME: TimeValue = { hour: 12, minute: 0 };

interface TimeRangePickerProps {
  isEnabled: boolean;
  onEnabledChange: (next: boolean) => void;
  initialStartTime?: TimeValue;
  initialEndTime?: TimeValue;
  onRangeChange?: (
    range: { startTime: TimeValue; endTime: TimeValue } | null,
  ) => void;
}

/** minTime 이후의 첫 번째 유효 시각을 반환 */
function firstValidAfter(minTime: TimeValue): TimeValue {
  if (minTime.minute === 0) return { hour: minTime.hour, minute: 30 };
  if (minTime.hour < 23) return { hour: minTime.hour + 1, minute: 0 };
  return minTime;
}

/** maxTime 이전의 첫 번째 유효 시각을 반환 */
function lastValidBefore(maxTime: TimeValue): TimeValue {
  if (maxTime.minute === 30) return { hour: maxTime.hour, minute: 0 };
  if (maxTime.hour > 0) return { hour: maxTime.hour - 1, minute: 30 };
  return maxTime;
}

export default function TimeRangePicker({
  isEnabled,
  onEnabledChange,
  initialStartTime = DEFAULT_START_TIME,
  initialEndTime = DEFAULT_END_TIME,
  onRangeChange,
}: TimeRangePickerProps) {
  const { startTime, endTime, handleStartTimeChange, handleEndTimeChange } =
    useTimeRangeSelect({ initialStartTime, initialEndTime });

  const [activeField, setActiveField] = useState<'start' | 'end' | null>(null);
  const [pendingValue, setPendingValue] =
    useState<TimeValue>(DEFAULT_START_TIME);

  useEffect(() => {
    if (!isEnabled) {
      onRangeChange?.(null);
      return;
    }
    if (
      startTime !== null &&
      endTime !== null &&
      isValidTimeRange(startTime, endTime)
    ) {
      onRangeChange?.({ startTime, endTime });
    } else {
      onRangeChange?.(null);
    }
  }, [isEnabled, startTime, endTime, onRangeChange]);

  function openPicker(field: 'start' | 'end') {
    if (field === 'end') {
      const start = startTime ?? DEFAULT_START_TIME;
      const current = endTime;
      const initial =
        current && isValidTimeRange(start, current)
          ? current
          : firstValidAfter(start);
      setPendingValue(initial);
    } else {
      const end = endTime ?? DEFAULT_END_TIME;
      const current = startTime;
      const initial =
        current && isValidTimeRange(current, end)
          ? current
          : lastValidBefore(end);
      setPendingValue(initial);
    }
    setActiveField(field);
  }

  function handleConfirm() {
    if (activeField === 'start') {
      handleStartTimeChange(pendingValue);
    } else if (activeField === 'end') {
      handleEndTimeChange(pendingValue);
    }
    setActiveField(null);
  }

  function handleCancel() {
    setActiveField(null);
  }

  const sheetLabel = activeField === 'start' ? '시작 시간' : '종료 시간';

  const pickerConstraint =
    activeField === 'end'
      ? { minTime: startTime ?? undefined }
      : { maxTime: endTime ?? undefined };

  const isEndInvalid =
    endTime !== null &&
    startTime !== null &&
    timeToMinutes(endTime) <= timeToMinutes(startTime);

  return (
    <>
      <section className='flex flex-col gap-2.5'>
        {/* 섹션 헤더 + 토글 */}
        <div className='flex items-center justify-between pt-6 pb-2'>
          <span className='text-text-secondary text-lg font-semibold'>
            시간 투표 받기
          </span>
          <Toggle
            checked={isEnabled}
            onChange={onEnabledChange}
            ariaLabel='시간 투표 받기 토글'
          />
        </div>

        {isEnabled && (
          <div className='flex flex-col gap-2.5'>
            {/* 시작 시간 카드 */}
            <button
              type='button'
              onClick={() => openPicker('start')}
              className='flex w-full items-center gap-5'
            >
              <span className='text-text-secondary shrink-0 text-base font-medium'>
                시작 시간
              </span>
              <div className='text-text-secondary flex flex-1 items-center justify-between rounded-[6px] border border-gray-200 bg-white px-5 py-3.5'>
                <span className='min-w-0 flex-1 text-center text-lg font-semibold tabular-nums'>
                  {String((startTime ?? DEFAULT_START_TIME).hour).padStart(
                    2,
                    '0',
                  )}
                </span>
                <span className='shrink-0 text-lg font-semibold'>:</span>
                <span className='min-w-0 flex-1 text-center text-lg font-semibold tabular-nums'>
                  {String((startTime ?? DEFAULT_START_TIME).minute).padStart(
                    2,
                    '0',
                  )}
                </span>
              </div>
            </button>

            {/* 종료 시간 카드 */}
            <button
              type='button'
              onClick={() => openPicker('end')}
              className='flex w-full items-center gap-5'
            >
              <span className='text-text-secondary shrink-0 text-base font-medium'>
                종료 시간
              </span>
              <div
                className={`flex flex-1 items-center justify-between rounded-[6px] border bg-white px-5 py-3.5 ${
                  isEndInvalid
                    ? 'border-red-400 text-red-400'
                    : 'text-text-secondary border-gray-200'
                }`}
              >
                <span className='min-w-0 flex-1 text-center text-lg font-semibold tabular-nums'>
                  {String((endTime ?? DEFAULT_END_TIME).hour).padStart(2, '0')}
                </span>
                <span className='shrink-0 text-lg font-semibold'>:</span>
                <span className='min-w-0 flex-1 text-center text-lg font-semibold tabular-nums'>
                  {String((endTime ?? DEFAULT_END_TIME).minute).padStart(
                    2,
                    '0',
                  )}
                </span>
              </div>
            </button>
          </div>
        )}
      </section>

      {/* 바텀 시트 — 휠 피커 */}
      <BottomSheet
        isOpen={activeField !== null}
        onClose={handleCancel}
        showCloseButton={false}
      >
        <div className='pt-2'>
          <p className='text-text-primary mb-4 text-center text-base font-semibold'>
            {sheetLabel}
          </p>
          <TimeWheelPicker
            value={pendingValue}
            onChange={setPendingValue}
            {...pickerConstraint}
          />
          <Button fullWidth onClick={handleConfirm} className='mt-6'>
            확인
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
