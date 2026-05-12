'use client';

import { useCallback, useRef, useState } from 'react';

import { slotKey } from '@/features/participant-register-time-slot/lib/timeSlotMatrix';

interface UseTimeSlotSelectionOptions {
  initial?: Set<string>;
}

type AnchorMode = 'add' | 'remove';

interface Anchor {
  dateIndex: number;
  slotIndex: number;
  mode: AnchorMode;
}

/**
 * 30분 슬롯 그리드의 "탭-탭 구간 선택" 상태 훅.
 *
 * 앵커는 위치 + mode(add/remove) 를 같이 들고 있다.
 *
 * - 빈 셀 탭: 단일 선택, 앵커 = (위치, add)
 * - 빈 셀 탭 (같은 컬럼, add 앵커 존재): 앵커 ~ 탭 위치 구간을 모두 선택, 앵커 해제
 * - 선택된 셀 탭: 단일 해제, 앵커 = (위치, remove)
 * - 선택된 셀 탭 (같은 컬럼, remove 앵커 존재): 앵커 ~ 탭 위치 구간을 모두 해제, 앵커 해제
 * - 그 외(컬럼 다름 / mode 불일치): 새 단일 탭으로 재시작 (앵커 갱신)
 *
 * 드래그(연속 다중) 는 의도적으로 제공하지 않는다 — 모바일에서 페이지 스크롤과
 * 충돌하지 않도록 단일 탭만으로 구간을 만들 수 있게 한 결정.
 *
 * 구현 메모: `setSelected` 의 업데이터 콜백 안에서 `anchorRef.current` 를 변이하면
 * React StrictMode 가 업데이터를 두 번 호출하면서 두 번째 실행 시 anchor 가 이미
 * 변경되어 분기를 잘못 타는 버그가 있다. 그래서 다음 상태 / 다음 앵커는 외부에서
 * 계산하고 `setSelected` 에는 값만 전달한다.
 */
export function useTimeSlotSelection(
  options: UseTimeSlotSelectionOptions = {},
) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(options.initial),
  );
  const anchorRef = useRef<Anchor | null>(null);

  const tapCell = useCallback(
    (dateIndex: number, slotIndex: number) => {
      const key = slotKey(dateIndex, slotIndex);
      const isAlreadySelected = selected.has(key);
      const desiredMode: AnchorMode = isAlreadySelected ? 'remove' : 'add';

      const next = new Set(selected);
      const anchor = anchorRef.current;

      const canRange =
        anchor !== null &&
        anchor.dateIndex === dateIndex &&
        anchor.slotIndex !== slotIndex &&
        anchor.mode === desiredMode;

      if (canRange && anchor !== null) {
        const sMin = Math.min(anchor.slotIndex, slotIndex);
        const sMax = Math.max(anchor.slotIndex, slotIndex);
        for (let s = sMin; s <= sMax; s += 1) {
          const k = slotKey(dateIndex, s);
          if (anchor.mode === 'add') next.add(k);
          else next.delete(k);
        }
        anchorRef.current = null;
      } else if (isAlreadySelected) {
        next.delete(key);
        anchorRef.current = { dateIndex, slotIndex, mode: 'remove' };
      } else {
        next.add(key);
        anchorRef.current = { dateIndex, slotIndex, mode: 'add' };
      }

      setSelected(next);
    },
    [selected],
  );

  const reset = useCallback(() => {
    setSelected(new Set());
    anchorRef.current = null;
  }, []);

  const replaceSelection = useCallback((next: Set<string>) => {
    setSelected(new Set(next));
    anchorRef.current = null;
  }, []);

  const isSelected = useCallback(
    (dateIndex: number, slotIndex: number) =>
      selected.has(slotKey(dateIndex, slotIndex)),
    [selected],
  );

  return {
    selected,
    isSelected,
    tapCell,
    reset,
    replaceSelection,
  };
}
