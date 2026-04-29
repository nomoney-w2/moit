'use client';

import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

import type {
  RankedSlot,
  TimeSlotId,
} from '@/features/vote-rank-cards/lib/types';
import { cn } from '@/shared/lib/utils';
import { Badge, type BadgeProps } from '@/shared/ui/Badge';
import Icon from '@/shared/ui/icon/Icon';

interface VoteRankCardProps {
  slot: RankedSlot;
  isOpen: boolean;
  onToggle: (id: TimeSlotId) => void;
}

function getRankBadgeVariant(rank: number): BadgeProps['variant'] {
  if (rank === 1) return 'rank1';
  if (rank === 2) return 'rank2';
  if (rank === 3) return 'rank3';
  if (rank === 4) return 'rank4';
  if (rank === 5) return 'rank5';
  return 'rank5';
}

function formatDateLabel(isoDate: string): string {
  return format(parseISO(isoDate), 'M월 d일 EEEE', { locale: ko });
}

export default function VoteRankCard({
  slot,
  isOpen,
  onToggle,
}: VoteRankCardProps) {
  const headerId = `vote-rank-card-header-${slot.id}`;
  const panelId = `vote-rank-card-panel-${slot.id}`;
  const hasBadge = slot.rank !== null && slot.rank >= 1 && slot.rank <= 5;

  return (
    <li className='bg-gray-0 overflow-hidden rounded-2xl border border-gray-200'>
      <button
        type='button'
        id={headerId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => onToggle(slot.id)}
        className='flex w-full items-center gap-3 px-5 py-4 text-left'
      >
        <div className='flex flex-1 flex-col gap-1'>
          <span className='text-body-4 text-gray-600'>
            {formatDateLabel(slot.date)}
          </span>
          <div className='flex items-center gap-2'>
            <span className='text-title-4 font-semibold text-gray-900'>
              {slot.startTime} - {slot.endTime}
            </span>
            {hasBadge ? (
              <Badge
                variant={getRankBadgeVariant(slot.rank as number)}
                size='sm'
              >
                {slot.rank}위
              </Badge>
            ) : null}
          </div>
        </div>
        <Icon
          name='arrow_down'
          size='sm'
          className={cn(
            'text-gray-400 transition-transform duration-200',
            !isOpen && 'rotate-180',
          )}
        />
      </button>
      <div
        id={panelId}
        role='region'
        aria-labelledby={headerId}
        hidden={!isOpen}
        className='border-t border-gray-100 px-5 py-4'
      >
        <VoteRankCardBody slot={slot} />
      </div>
    </li>
  );
}

function VoteRankCardBody({ slot }: { slot: RankedSlot }) {
  return (
    <div className='flex flex-col gap-4'>
      <section>
        <h3 className='text-body-2 font-semibold text-gray-900'>
          {slot.canCount}명이 가능해요
        </h3>
        {slot.canCount > 0 ? (
          <ul className='text-body-4 mt-2 flex flex-wrap gap-x-3 gap-y-1 text-gray-700'>
            {slot.canPeople.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        ) : (
          <p className='text-body-4 mt-2 text-gray-400'>아무도 없어요</p>
        )}
      </section>
      <section>
        <h3 className='text-body-2 font-semibold text-gray-900'>
          {slot.cannotCount}명이 못와요
        </h3>
        {slot.cannotCount > 0 ? (
          <ul className='text-body-4 mt-2 flex flex-wrap gap-x-3 gap-y-1 text-gray-500'>
            {slot.cannotPeople.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        ) : (
          <p className='text-body-4 mt-2 text-gray-400'>모두 가능해요</p>
        )}
      </section>
    </div>
  );
}
