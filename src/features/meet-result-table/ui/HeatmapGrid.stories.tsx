import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { generateMockVoteTimeSlotStat } from '@/entities/voteTimeSlotStat/lib/mock';

import HeatmapGrid from './HeatmapGrid';

const meta: Meta<typeof HeatmapGrid> = {
  title: 'Features/MeetResultTable/HeatmapGrid',
  component: HeatmapGrid,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    selected: null,
    onSelect: () => {},
    timeRange: { startTime: '09:00', endTime: '18:00', slotCount: 18 },
  },
};

export default meta;
type Story = StoryObj<typeof HeatmapGrid>;

const PARTICIPANTS = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  name: `참여자${i + 1}`,
}));

const FOUR_DATES = ['2026-04-16', '2026-04-17', '2026-04-18', '2026-04-20'];
const SEVEN_DATES = [...FOUR_DATES, '2026-04-21', '2026-04-22', '2026-04-23'];
const ONE_DATE = ['2026-04-16'];
const MANY_DATES = Array.from({ length: 14 }, (_, i) => {
  const d = new Date('2026-04-16');
  d.setDate(d.getDate() + i);
  return d.toISOString().slice(0, 10);
});

export const FullVote: Story = {
  name: '풀 투표 (9명, 7일) — Figma 기본',
  args: {
    slotStat: generateMockVoteTimeSlotStat('demo-1', SEVEN_DATES),
  },
};

export const FewDates: Story = {
  name: '후보 날짜 1개',
  args: {
    slotStat: generateMockVoteTimeSlotStat('demo-2', ONE_DATE),
  },
};

export const FourDates: Story = {
  name: '후보 날짜 4개 — 화면 폭 딱 맞음',
  args: {
    slotStat: generateMockVoteTimeSlotStat('demo-3', FOUR_DATES),
  },
};

export const ManyDates: Story = {
  name: '후보 날짜 14개 — 가로 스크롤',
  args: {
    slotStat: generateMockVoteTimeSlotStat('demo-4', MANY_DATES),
  },
};

export const ZeroVotes: Story = {
  name: '0명 투표 — 모든 셀 베이스 톤',
  args: {
    slotStat: {
      meetingId: 'empty',
      dates: SEVEN_DATES,
      cells: SEVEN_DATES.flatMap((date) =>
        Array.from({ length: 24 }, (_, slotIdx) => ({
          date,
          slotIdx,
          count: 0,
          participants: [],
        })),
      ),
      allParticipants: PARTICIPANTS,
    },
  },
};

export const EarlyMorning: Story = {
  name: '새벽 시간대 — 좌측 시 라벨 두 자리수(00~06)',
  args: {
    slotStat: generateMockVoteTimeSlotStat('demo-early', SEVEN_DATES),
    timeRange: { startTime: '00:00', endTime: '06:00', slotCount: 12 },
  },
};

export const AllTied: Story = {
  name: '모든 셀 동률 5명 — 1위 100% 단일 농도',
  args: {
    slotStat: {
      meetingId: 'tied',
      dates: FOUR_DATES,
      cells: FOUR_DATES.flatMap((date) =>
        Array.from({ length: 24 }, (_, slotIdx) => ({
          date,
          slotIdx,
          count: 5,
          participants: PARTICIPANTS.slice(0, 5),
        })),
      ),
      allParticipants: PARTICIPANTS,
    },
  },
};
