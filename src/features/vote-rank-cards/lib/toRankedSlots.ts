import { addMinutes, format, parse } from 'date-fns';

import {
  rankSlots,
  type SlotCount,
} from '@/features/vote-rank-cards/lib/rankSlots';
import type {
  IsoDate,
  MeetingTimeRange,
  MeetingVoteSnapshot,
  RankBadgeGroup,
  RankedListResult,
  RankedSlot,
  RankedSlotPerson,
  Time,
  TimeSlotId,
} from '@/features/vote-rank-cards/lib/types';

interface ToRankedSlotsOptions {
  today?: IsoDate;
}

const TIME_FORMAT = 'HH:mm';

function buildSlotId(date: IsoDate, slotIndex: number): TimeSlotId {
  return `${date}#${slotIndex}`;
}

function parseTime(timeStr: Time): Date {
  return parse(timeStr, TIME_FORMAT, new Date(2000, 0, 1));
}

function formatTime(date: Date): Time {
  return format(date, TIME_FORMAT);
}

function getSlotDuration(timeRange: MeetingTimeRange): number {
  if (timeRange.slotCount <= 0) return 0;
  const start = parseTime(timeRange.startTime);
  const end = parseTime(timeRange.endTime);
  const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  return totalMinutes / timeRange.slotCount;
}

function computeSlotTimes(
  timeRange: MeetingTimeRange,
  slotIndex: number,
  durationMinutes: number,
): { startTime: Time; endTime: Time } {
  const baseStart = parseTime(timeRange.startTime);
  const slotStart = addMinutes(baseStart, slotIndex * durationMinutes);
  const slotEnd = addMinutes(slotStart, durationMinutes);
  return { startTime: formatTime(slotStart), endTime: formatTime(slotEnd) };
}

function mapBadgeGroup(rank: number | null): RankBadgeGroup {
  if (rank === 1) return 'rank1';
  if (rank === 2 || rank === 3) return 'rank2-3';
  if (rank === 4 || rank === 5) return 'rank4-5';
  return 'none';
}

function todayIso(): IsoDate {
  return format(new Date(), 'yyyy-MM-dd');
}

export function toRankedSlots(
  snapshot: MeetingVoteSnapshot,
  options?: ToRankedSlotsOptions,
): RankedListResult {
  const today = options?.today ?? todayIso();
  const votedParticipants = snapshot.participants.filter((p) => p.hasVoted);
  const totalVoters = votedParticipants.length;

  if (totalVoters === 0) {
    return {
      slots: [],
      totalVoters: 0,
      meetingTitle: snapshot.title,
      hostName: snapshot.hostName,
      isEmpty: true,
    };
  }

  const durationMinutes = getSlotDuration(snapshot.timeRange);
  const slotMap = new Map<
    TimeSlotId,
    {
      slot: RankedSlot;
      canCount: number;
      date: IsoDate;
      slotIndex: number;
    }
  >();

  for (let dateIndex = 0; dateIndex < snapshot.dates.length; dateIndex += 1) {
    const date = snapshot.dates[dateIndex];
    for (
      let slotIndex = 0;
      slotIndex < snapshot.timeRange.slotCount;
      slotIndex += 1
    ) {
      const id = buildSlotId(date, slotIndex);
      const canPeople: RankedSlotPerson[] = [];
      const cannotPeople: RankedSlotPerson[] = [];

      for (const participant of votedParticipants) {
        const dateRow = participant.voteTimeSlots[dateIndex];
        const isAvailable = Boolean(dateRow?.[slotIndex]);
        const person: RankedSlotPerson = {
          id: String(participant.id),
          name: participant.name,
        };
        if (isAvailable) canPeople.push(person);
        else cannotPeople.push(person);
      }

      const { startTime, endTime } = computeSlotTimes(
        snapshot.timeRange,
        slotIndex,
        durationMinutes,
      );

      slotMap.set(id, {
        slot: {
          id,
          date,
          slotIndex,
          startTime,
          endTime,
          rank: null,
          badgeGroup: 'none',
          canPeople,
          cannotPeople,
          canCount: canPeople.length,
          cannotCount: cannotPeople.length,
        },
        canCount: canPeople.length,
        date,
        slotIndex,
      });
    }
  }

  const slotCounts: SlotCount[] = Array.from(slotMap.values()).map(
    ({ slot, canCount, date, slotIndex }) => ({
      id: slot.id,
      date,
      slotIndex,
      canCount,
    }),
  );

  const ranked = rankSlots(slotCounts, today);

  const orderedSlots: RankedSlot[] = [];
  for (const meta of ranked) {
    if (!meta.visible) continue;
    const entry = slotMap.get(meta.id);
    if (!entry) continue;
    if (entry.canCount === 0) continue;
    orderedSlots.push({
      ...entry.slot,
      rank: meta.rank,
      badgeGroup: mapBadgeGroup(meta.rank),
    });
  }

  return {
    slots: orderedSlots,
    totalVoters,
    meetingTitle: snapshot.title,
    hostName: snapshot.hostName,
    isEmpty: orderedSlots.length === 0,
  };
}
