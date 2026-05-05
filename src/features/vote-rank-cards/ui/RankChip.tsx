import { cn } from '@/shared/lib/utils';

export type RankChipRank = 1 | 2 | 3 | 4 | 5;

interface RankChipProps {
  rank: RankChipRank;
}

const RANK_CHIP_COLOR: Record<RankChipRank, string> = {
  1: 'bg-primary-default text-gray-0',
  2: 'bg-primary-default/10 text-primary-default',
  3: 'bg-primary-default/10 text-primary-default',
  4: 'bg-gray-100 text-gray-900',
  5: 'bg-gray-100 text-gray-900',
};

export default function RankChip({ rank }: RankChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[4px] px-2 py-0.5 leading-none',
        RANK_CHIP_COLOR[rank],
      )}
    >
      <span className='text-[11px] leading-4 tracking-[-0.02em]'>{rank}위</span>
    </span>
  );
}
