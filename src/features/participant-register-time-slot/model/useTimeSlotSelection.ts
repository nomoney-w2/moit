'use client';

import { useCallback, useRef, useState } from 'react';

import {
  rectKeys,
  slotKey,
} from '@/features/participant-register-time-slot/lib/timeSlotMatrix';

interface UseTimeSlotSelectionOptions {
  initial?: Set<string>;
}

/**
 * 30분 슬롯 그리드의 드래그 다중 선택 상태 훅.
 * - `beginDrag`: pointer down. 시작 셀이 unselected → additive(추가) 모드, selected → remove(해제) 모드.
 * - `updateDrag`: pointer enter. 시작점 ~ 현재점 사각형 영역에 모드 적용.
 * - `endDrag`: pointer up/cancel/leave. 드래그 종료.
 * - `reset` / `replaceSelection`: 외부에서 selection 일괄 변경 (빈 set / 기존 투표 채움 등).
 *
 * 드래그 진행 중 중간 위치(`draggingTo`) 는 외부에 노출하지 않는다 (매 pointermove
 * 시 setState 가 발생하면 그리드 전체가 리렌더되어 성능 저하). 시각 피드백은
 * `selected` set 자체로 충분하다.
 */
export function useTimeSlotSelection(
  options: UseTimeSlotSelectionOptions = {},
) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(options.initial),
  );
  const dragOriginRef = useRef<{
    dateIndex: number;
    slotIndex: number;
    additive: boolean;
    baseline: Set<string>;
  } | null>(null);

  const beginDrag = useCallback(
    (dateIndex: number, slotIndex: number) => {
      const key = slotKey(dateIndex, slotIndex);
      const additive = !selected.has(key);
      dragOriginRef.current = {
        dateIndex,
        slotIndex,
        additive,
        baseline: new Set(selected),
      };
      setSelected((prev) => {
        const next = new Set(prev);
        if (additive) next.add(key);
        else next.delete(key);
        return next;
      });
    },
    [selected],
  );

  const updateDrag = useCallback((dateIndex: number, slotIndex: number) => {
    const origin = dragOriginRef.current;
    if (!origin) return;
    const region = rectKeys(
      origin.dateIndex,
      origin.slotIndex,
      dateIndex,
      slotIndex,
    );
    setSelected(() => {
      const next = new Set(origin.baseline);
      if (origin.additive) {
        for (const key of region) next.add(key);
      } else {
        for (const key of region) next.delete(key);
      }
      return next;
    });
  }, []);

  const endDrag = useCallback(() => {
    dragOriginRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setSelected(new Set());
    dragOriginRef.current = null;
  }, []);

  const replaceSelection = useCallback((next: Set<string>) => {
    setSelected(new Set(next));
  }, []);

  const isSelected = useCallback(
    (dateIndex: number, slotIndex: number) =>
      selected.has(slotKey(dateIndex, slotIndex)),
    [selected],
  );

  return {
    selected,
    isSelected,
    beginDrag,
    updateDrag,
    endDrag,
    reset,
    replaceSelection,
  };
}
