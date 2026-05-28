import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { generateMockVoteTimeSlotStat } from '@/entities/voteTimeSlotStat/lib/mock';

import ResultTableView from './ResultTableView';

const meta: Meta<typeof ResultTableView> = {
  title: 'Features/MeetResultTable/ResultTableView',
  component: ResultTableView,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ResultTableView>;

const SEVEN_DATES = [
  '2026-04-16',
  '2026-04-17',
  '2026-04-18',
  '2026-04-20',
  '2026-04-21',
  '2026-04-22',
  '2026-04-23',
];

const COMMON = {
  voteCount: 9,
  mode: 'table' as const,
  onToggle: () => {},
  selected: null,
  isExpanded: true,
  position: 'top' as const,
  onSelect: () => {},
  onClose: () => {},
  onCollapse: () => {},
  onExpand: () => {},
  onMoveTo: () => {},
  timeRange: { startTime: '09:00', endTime: '18:00', slotCount: 18 },
};

export const TableMode: Story = {
  args: {
    ...COMMON,
    slotStat: generateMockVoteTimeSlotStat('demo-table', SEVEN_DATES),
  },
};

export const ZeroVotes: Story = {
  args: {
    ...COMMON,
    voteCount: 0,
    slotStat: {
      meetingId: 'empty',
      dates: SEVEN_DATES,
      cells: [],
      allParticipants: [],
    },
  },
};

export const EarlyMorning: Story = {
  name: '새벽 시간대 — 좌측 시 라벨 두 자리수(00~06)',
  args: {
    ...COMMON,
    slotStat: generateMockVoteTimeSlotStat('demo-table-early', SEVEN_DATES),
    timeRange: { startTime: '00:00', endTime: '06:00', slotCount: 12 },
  },
};
