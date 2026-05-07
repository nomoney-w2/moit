import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  mockAllTieMeetingVoteSnapshot,
  mockEmptyMeetingVoteSnapshot,
  mockMeetingVoteSnapshot,
} from '@/features/vote-rank-cards/lib/mock';
import type { MeetingVoteSnapshot } from '@/features/vote-rank-cards/lib/types';
import VoteRankCardsPage from '@/features/vote-rank-cards/ui/VoteRankCardsPage';

const lessThanFiveSnapshot: MeetingVoteSnapshot = {
  id: 'meet-less-than-five-001',
  title: '슬롯 ≤ 5',
  dates: ['2026-04-17', '2026-04-18'],
  status: 'VOTING',
  finalizedDate: null,
  maxParticipantCount: 4,
  participants: [
    {
      id: 1,
      name: 'A',
      voteDates: ['2026-04-17', '2026-04-18'],
      voteTimeSlots: [
        [true, false],
        [true, true],
      ],
      hasVoted: true,
    },
    {
      id: 2,
      name: 'B',
      voteDates: ['2026-04-17', '2026-04-18'],
      voteTimeSlots: [
        [true, true],
        [false, true],
      ],
      hasVoted: true,
    },
  ],
  hostName: '김야뿌',
  timeRange: { startTime: '12:00', endTime: '13:00', slotCount: 2 },
};

const meta: Meta<typeof VoteRankCardsPage> = {
  title: 'Features/VoteRankCards/VoteRankCardsPage',
  component: VoteRankCardsPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof VoteRankCardsPage>;

export const Default: Story = {
  args: { snapshot: mockMeetingVoteSnapshot },
};

export const Empty: Story = {
  args: { snapshot: mockEmptyMeetingVoteSnapshot },
};

export const AllTie: Story = {
  args: { snapshot: mockAllTieMeetingVoteSnapshot },
};

export const LessThanFiveSlots: Story = {
  args: { snapshot: lessThanFiveSnapshot },
};
