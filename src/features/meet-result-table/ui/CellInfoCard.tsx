'use client';

import {
  type PointerEvent as ReactPointerEvent,
  useRef,
  useState,
} from 'react';

import { type VoteTimeSlotStat } from '@/entities/voteTimeSlotStat/dto/voteTimeSlotStat.dto';
import { SLOTS_PER_HOUR, START_HOUR } from '@/shared/config/timeSlot';
import { parseDate } from '@/shared/lib/date';
import Chip from '@/shared/ui/chip/Chip';
import Icon from '@/shared/ui/icon/Icon';

import { computeHeatmapIntensity } from '../lib/computeHeatmapIntensity';
import { cellKey } from '../lib/slotKey';
import { rankFromOpacity } from '../lib/timeSlotConstants';
import {
  type CardPosition,
  type CollapsedSide,
  type SelectedCell,
} from '../model/useSelectedCell';

const WEEK_KO = ['일', '월', '화', '수', '목', '금', '토'];
const COLLAPSE_THRESHOLD_PX = 100;
const SNAP_THRESHOLD_PX = 80;
const SCREEN_SM_PX = 640;
const CARD_INSET_X_PX = 12;
const CARD_MAX_W_PX = SCREEN_SM_PX - CARD_INSET_X_PX * 2;

function formatDate(dateStr: string): string {
  const d = parseDate(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = WEEK_KO[d.getDay()];
  return `${month}월 ${day}일 ${weekday}요일`;
}

function formatSlotRange(slotIdx: number): string {
  const startMin = START_HOUR * 60 + slotIdx * (60 / SLOTS_PER_HOUR);
  const endMin = startMin + 60 / SLOTS_PER_HOUR;
  const fmt = (m: number) => {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };
  return `${fmt(startMin)} - ${fmt(endMin)}`;
}

interface CellInfoCardProps {
  slotStat: VoteTimeSlotStat;
  selected: SelectedCell;
  isExpanded: boolean;
  position: CardPosition;
  collapsedSide: CollapsedSide;
  onClose: () => void;
  onCollapse: (side: CollapsedSide) => void;
  onExpand: () => void;
  onMoveTo: (position: CardPosition) => void;
}

export default function CellInfoCard({
  slotStat,
  selected,
  isExpanded,
  position,
  collapsedSide,
  onClose,
  onCollapse,
  onExpand,
  onMoveTo,
}: CellInfoCardProps) {
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0 });

  if (!selected) return null;

  // 수납된 상태 — 마지막 throw 방향 (좌/우) 화면 끝에 작은 화살표 버튼만 노출.
  if (!isExpanded) {
    const sideStyle =
      collapsedSide === 'right'
        ? { right: `max(0px, calc(50vw - ${SCREEN_SM_PX / 2}px))` }
        : { left: `max(0px, calc(50vw - ${SCREEN_SM_PX / 2}px))` };
    const sideRoundedClass =
      collapsedSide === 'right' ? 'rounded-l-xl' : 'rounded-r-xl';
    // 우측 수납이면 화살표가 좌측 향함 (`<`), 좌측 수납이면 우측 향함 (`>`).
    const arrowPath =
      collapsedSide === 'right' ? 'M9 3L5 7l4 4' : 'M5 3l4 4-4 4';

    return (
      <button
        type='button'
        aria-label='카드 펼치기'
        onClick={onExpand}
        style={sideStyle}
        className={`fixed top-1/2 z-60 flex h-20 w-7 -translate-y-1/2 items-center justify-center bg-gray-700/80 text-white shadow-md backdrop-blur-sm ${sideRoundedClass}`}
      >
        <svg width='14' height='14' viewBox='0 0 14 14' fill='none' aria-hidden>
          <path
            d={arrowPath}
            stroke='currentColor'
            strokeWidth='1.6'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </button>
    );
  }

  const intensityMap = computeHeatmapIntensity(slotStat.cells);
  const key = cellKey(selected.date, selected.slotIdx);
  const cell = slotStat.cells.find(
    (c) => c.date === selected.date && c.slotIdx === selected.slotIdx,
  );
  const canPeople = cell?.participants ?? [];
  const canIds = new Set(canPeople.map((p) => p.id));
  const cannotPeople = slotStat.allParticipants.filter(
    (p) => !canIds.has(p.id),
  );
  const intensity = intensityMap.get(key) ?? null;
  const rank = rankFromOpacity(intensity);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // synthetic event 또는 미지원 환경 — capture 없이도 동작
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    setDrag({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = null;
    setDrag({ x: 0, y: 0 });

    // 좌·우 throw 가 임계 넘으면 수납 (위/아래 스냅보다 우선)
    if (Math.abs(dx) > COLLAPSE_THRESHOLD_PX) {
      onCollapse(dx > 0 ? 'right' : 'left');
    } else if (Math.abs(dy) > SNAP_THRESHOLD_PX) {
      if (dy > 0 && position === 'top') onMoveTo('bottom');
      else if (dy < 0 && position === 'bottom') onMoveTo('top');
    }

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div
      role='dialog'
      aria-modal='false'
      aria-label='시간 슬롯 상세'
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: `translate(${drag.x}px, ${drag.y}px)`,
        transition:
          drag.x === 0 && drag.y === 0
            ? 'transform 200ms ease-out, top 200ms ease-out, bottom 200ms ease-out'
            : 'none',
        maxWidth: CARD_MAX_W_PX,
      }}
      className={`fixed inset-x-3 z-60 mx-auto cursor-grab touch-none rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)] active:cursor-grabbing ${
        position === 'top' ? 'top-16' : 'bottom-28'
      }`}
    >
      <div className='flex items-center gap-2'>
        {rank !== null && (
          <span className='bg-primary-default flex h-6 items-center rounded-md px-2 text-[12px] font-bold text-white'>
            {rank}위
          </span>
        )}
        <span className='text-text-primary flex-1 text-[15px] font-bold'>
          {formatDate(selected.date)} {formatSlotRange(selected.slotIdx)}
        </span>
        <button
          type='button'
          aria-label='닫기'
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
          className='text-text-tertiary hover:text-text-primary'
        >
          <svg width='20' height='20' viewBox='0 0 20 20' fill='none'>
            <path
              d='M5 5l10 10M15 5L5 15'
              stroke='currentColor'
              strokeWidth='1.6'
              strokeLinecap='round'
            />
          </svg>
        </button>
      </div>

      <hr className='my-3 border-gray-100' />

      <div className='text-primary-default flex items-center gap-1'>
        <Icon name='ic_circle_check_filled' size={16} />
        <span className='text-[13px] font-semibold'>가능한 사람</span>
      </div>
      <div className='mt-2 flex flex-wrap gap-1.5'>
        {canPeople.length === 0 ? (
          <span className='text-text-tertiary text-[13px]'>아무도 없어요</span>
        ) : (
          canPeople.map((p) => (
            <Chip
              key={p.id}
              text={p.name}
              variant='fill'
              size='sm'
              selectable={false}
            />
          ))
        )}
      </div>

      <div className='mt-3 flex items-center gap-1 text-orange-500'>
        <Icon name='ic_circle_x_filled' size={16} />
        <span className='text-[13px] font-semibold'>안되는 사람</span>
      </div>
      <div className='mt-2 flex flex-wrap gap-1.5'>
        {cannotPeople.length === 0 ? (
          <span className='text-text-tertiary text-[13px]'>모두 가능해요</span>
        ) : (
          cannotPeople.map((p) => (
            <Chip
              key={p.id}
              text={p.name}
              variant='fill'
              size='sm'
              selectable={false}
            />
          ))
        )}
      </div>
    </div>
  );
}
