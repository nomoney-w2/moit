export type IsoDate = string;
export type Time = string;
export type MeetingStatus = 'VOTING' | 'FINALIZED' | 'CLOSED';

export interface MeetingTimeRange {
  startTime: Time;
  endTime: Time;
  slotCount: number;
}

export interface ParticipantVote {
  id: number;
  name: string;
  voteDates: IsoDate[];
  voteTimeSlots: boolean[][];
  hasVoted: boolean;
}

export interface MeetingVoteSnapshot {
  id: string;
  title: string;
  dates: IsoDate[];
  status: MeetingStatus;
  finalizedDate?: IsoDate | null;
  maxParticipantCount: number;
  participants: ParticipantVote[];
  hostName: string;
  timeRange: MeetingTimeRange;
}

export interface TimeSlotKey {
  date: IsoDate;
  slotIndex: number;
}

export type TimeSlotId = string;

export type RankBadgeGroup = 'rank1' | 'rank2-3' | 'rank4-5' | 'none';

export interface RankedSlotPerson {
  id: string;
  name: string;
}

export interface RankedSlot {
  id: TimeSlotId;
  date: IsoDate;
  slotIndex: number;
  startTime: Time;
  endTime: Time;
  rank: number | null;
  badgeGroup: RankBadgeGroup;
  canPeople: RankedSlotPerson[];
  cannotPeople: RankedSlotPerson[];
  canCount: number;
  cannotCount: number;
}

export interface RankedListResult {
  slots: RankedSlot[];
  totalVoters: number;
  meetingTitle: string;
  hostName: string;
  isEmpty: boolean;
}
