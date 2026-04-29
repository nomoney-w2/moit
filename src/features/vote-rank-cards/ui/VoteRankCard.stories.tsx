import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type {
  RankBadgeGroup,
  RankedSlot,
} from '@/features/vote-rank-cards/lib/types';
import VoteRankCard from '@/features/vote-rank-cards/ui/VoteRankCard';

const baseCanPeople = [
  { id: '1', name: '상민' },
  { id: '2', name: '쮸니' },
  { id: '3', name: '나용짱' },
  { id: '4', name: '윤정' },
  { id: '5', name: '호연왕자' },
  { id: '6', name: '재민누나' },
  { id: '7', name: '예진공쥬' },
];

function makeSlot(
  rank: number | null,
  badgeGroup: RankBadgeGroup,
  canCount: number,
  cannotCount: number,
): RankedSlot {
  return {
    id: `2026-04-17#0-${rank ?? 'none'}`,
    date: '2026-04-17',
    slotIndex: 0,
    startTime: '12:00',
    endTime: '12:30',
    rank,
    badgeGroup,
    canPeople: baseCanPeople.slice(0, canCount),
    cannotPeople: [
      { id: '8', name: '냐옹' },
      { id: '9', name: '미투표자' },
    ].slice(0, cannotCount),
    canCount,
    cannotCount,
  };
}

const meta: Meta<typeof VoteRankCard> = {
  title: 'Features/VoteRankCards/VoteRankCard',
  component: VoteRankCard,
  parameters: {
    layout: 'padded',
  },
  args: {
    onToggle: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof VoteRankCard>;

export const Rank1: Story = {
  args: { isOpen: false, slot: makeSlot(1, 'rank1', 7, 1) },
};

export const Rank2: Story = {
  args: { isOpen: false, slot: makeSlot(2, 'rank2-3', 5, 3) },
};

export const Rank3: Story = {
  args: { isOpen: false, slot: makeSlot(3, 'rank2-3', 4, 4) },
};

export const Rank4: Story = {
  args: { isOpen: false, slot: makeSlot(4, 'rank4-5', 3, 5) },
};

export const Rank5: Story = {
  args: { isOpen: false, slot: makeSlot(5, 'rank4-5', 2, 6) },
};

export const NoRankPositive: Story = {
  args: { isOpen: false, slot: makeSlot(null, 'none', 1, 7) },
};

export const ZeroVote: Story = {
  args: { isOpen: false, slot: makeSlot(null, 'none', 0, 8) },
};

export const Open: Story = {
  args: { isOpen: true, slot: makeSlot(1, 'rank1', 7, 1) },
};

export const OpenManyParticipants: Story = {
  args: { isOpen: true, slot: makeSlot(1, 'rank1', 7, 0) },
};
