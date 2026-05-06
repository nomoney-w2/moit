import type { RankBadgeGroup } from '@/features/vote-rank-cards/lib/types';
import { cn } from '@/shared/lib/utils';

type ActiveBadgeGroup = Exclude<RankBadgeGroup, 'none'>;

interface RankChipProps {
  rank: number;
  badgeGroup: ActiveBadgeGroup;
}

const RANK_CHIP_COLOR: Record<ActiveBadgeGroup, string> = {
  rank1: 'bg-primary-default text-gray-0',
  'rank2-3': 'bg-primary-default/10 text-primary-default',
  'rank4-5': 'bg-gray-100 text-gray-900',
};

export default function RankChip({ rank, badgeGroup }: RankChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[4px] px-2 py-0.5 leading-none',
        RANK_CHIP_COLOR[badgeGroup],
      )}
    >
      <span className='text-[11px] leading-4 tracking-[-0.02em]'>{rank}위</span>
    </span>
  );
}
