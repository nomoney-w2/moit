import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import RankChip from '@/features/vote-rank-cards/ui/RankChip';

const meta: Meta<typeof RankChip> = {
  title: 'Features/VoteRankCards/RankChip',
  component: RankChip,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof RankChip>;

export const Rank1: Story = { args: { rank: 1, badgeGroup: 'rank1' } };
export const Rank2: Story = { args: { rank: 2, badgeGroup: 'rank2-3' } };
export const Rank3: Story = { args: { rank: 3, badgeGroup: 'rank2-3' } };
export const Rank4: Story = { args: { rank: 4, badgeGroup: 'rank4-5' } };
export const Rank5: Story = { args: { rank: 5, badgeGroup: 'rank4-5' } };

export const AllRanks: Story = {
  render: () => (
    <div className='flex items-center gap-2'>
      <RankChip rank={1} badgeGroup='rank1' />
      <RankChip rank={2} badgeGroup='rank2-3' />
      <RankChip rank={3} badgeGroup='rank2-3' />
      <RankChip rank={4} badgeGroup='rank4-5' />
      <RankChip rank={5} badgeGroup='rank4-5' />
    </div>
  ),
};
