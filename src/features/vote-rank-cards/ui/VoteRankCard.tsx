'use client';

import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

import type {
  RankedSlot,
  TimeSlotId,
} from '@/features/vote-rank-cards/lib/types';
import RankChip, {
  type RankChipRank,
} from '@/features/vote-rank-cards/ui/RankChip';
import { cn } from '@/shared/lib/utils';
import Chip from '@/shared/ui/chip/Chip';
import Icon from '@/shared/ui/icon/Icon';

interface VoteRankCardProps {
  slot: RankedSlot;
  totalVoters: number;
  isOpen: boolean;
  onToggle: (id: TimeSlotId) => void;
}

function formatDateLabel(isoDate: string): string {
  return format(parseISO(isoDate), 'M월 d일 EEEE', { locale: ko });
}

export default function VoteRankCard({
  slot,
  totalVoters,
  isOpen,
  onToggle,
}: VoteRankCardProps) {
  const headerId = `vote-rank-card-header-${slot.id}`;
  const panelId = `vote-rank-card-panel-${slot.id}`;
  const hasBadge = slot.rank !== null && slot.rank >= 1 && slot.rank <= 5;

  return (
    <li className='bg-gray-0 overflow-hidden rounded-lg border border-gray-200'>
      <button
        type='button'
        id={headerId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => onToggle(slot.id)}
        className='flex w-full items-center gap-3 px-5 py-4 text-left'
      >
        <div className='flex flex-1 flex-col gap-0.75'>
          <span className='text-body-4 text-text-secondary'>
            {formatDateLabel(slot.date)}
          </span>
          <div className='flex items-center gap-1.5'>
            <span className='text-title-7 text-gray-900'>
              {slot.startTime} - {slot.endTime}
            </span>
            {hasBadge ? <RankChip rank={slot.rank as RankChipRank} /> : null}
          </div>
        </div>
        <div className='flex shrink-0 items-center gap-1'>
          <div className='flex items-center gap-0.5'>
            <Icon name='ic_people' size={16} className='text-text-tertiary' />
            <span className='text-body-4 text-text-tertiary'>
              <span className='text-gray-900'>{slot.canCount}</span>
              <span>/{totalVoters}</span>
            </span>
          </div>
          <Icon
            name='arrow_down'
            size='md'
            className={cn(
              'text-text-tertiary transition-transform duration-200',
              !isOpen && 'rotate-180',
            )}
          />
        </div>
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
      <section className='flex flex-col gap-2'>
        <div className='text-body-5 text-primary-default flex items-center gap-0.5'>
          <Icon name='ic_circle_check_filled' size={16} />
          {slot.canCount}명이 가능해요
        </div>
        {slot.canCount > 0 ? (
          <div className='flex flex-wrap gap-1.5'>
            {slot.canPeople.map((p) => (
              <Chip
                key={p.id}
                text={p.name}
                variant='fill'
                size='sm'
                selectable={false}
              />
            ))}
          </div>
        ) : (
          <p className='text-body-5 text-text-tertiary'>아무도 없어요</p>
        )}
      </section>
      <section className='flex flex-col gap-2'>
        <div className='text-body-5 flex items-center gap-0.5 text-orange-700'>
          <Icon name='ic_circle_x_filled' size={16} />
          {slot.cannotCount}명이 못와요
        </div>
        {slot.cannotCount > 0 ? (
          <div className='flex flex-wrap gap-1.5'>
            {slot.cannotPeople.map((p) => (
              <Chip
                key={p.id}
                text={p.name}
                variant='fill'
                size='sm'
                selectable={false}
              />
            ))}
          </div>
        ) : (
          <p className='text-body-5 text-text-tertiary'>모두 가능해요</p>
        )}
      </section>
    </div>
  );
}
