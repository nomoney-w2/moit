import { z } from 'zod';

export const timeSlotCellDto = z.object({
  date: z.string(),
  slotIdx: z.number().int().min(0).max(23),
  count: z.number().int().min(0),
  participants: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
    }),
  ),
});

export const voteTimeSlotStatDto = z.object({
  meetingId: z.string(),
  dates: z.array(z.string()),
  cells: z.array(timeSlotCellDto),
  allParticipants: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
    }),
  ),
});

export type TimeSlotCell = z.infer<typeof timeSlotCellDto>;
export type VoteTimeSlotStat = z.infer<typeof voteTimeSlotStatDto>;
