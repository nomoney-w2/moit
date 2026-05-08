'use client';

import { type VoteTimeSlotStat } from '@/entities/voteTimeSlotStat/dto/voteTimeSlotStat.dto';
import { SLOTS_PER_HOUR, START_HOUR } from '@/shared/config/timeSlot';
import { parseDate } from '@/shared/lib/date';
import Chip from '@/shared/ui/chip/Chip';
import Icon from '@/shared/ui/icon/Icon';

import { computeHeatmapIntensity } from '../lib/computeHeatmapIntensity';
import { cellKey } from '../lib/slotKey';
import { rankFromOpacity } from '../lib/timeSlotConstants';
import { type SelectedCell } from '../model/useSelectedCell';

const WEEK_KO = ['일', '월', '화', '수', '목', '금', '토'];
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
  onClose: () => void;
}

export default function CellInfoCard({
  slotStat,
  selected,
  onClose,
}: CellInfoCardProps) {
  if (!selected) return null;

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

  return (
    <div
      role='dialog'
      aria-modal='false'
      aria-label='시간 슬롯 상세'
      style={{ maxWidth: CARD_MAX_W_PX }}
      className='fixed inset-x-3 bottom-28 z-60 mx-auto rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)]'
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
