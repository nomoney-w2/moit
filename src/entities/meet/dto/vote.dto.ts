import { z } from 'zod';

// ==================== Zod Schemas ====================

/**
 * 투표 생성/수정 요청 스키마
 * - voteTimeSlots: 시간 모임 투표용. 차원: dates.length × slotCount.
 *   날짜 단위 모임에서는 미포함 (undefined).
 */
export const voteRequestDto = z.object({
  meetingId: z.string(),
  name: z.string(),
  voteDates: z.array(z.string()),
  voteTimeSlots: z.array(z.array(z.boolean())).optional(),
});

/**
 * 투표 생성/수정 응답 스키마
 */
export const voteResponseDto = z.object({
  success: z.boolean(),
});

// ==================== TypeScript Types ====================

/**
 * 투표 생성/수정 요청 타입
 */
export type VoteRequest = z.infer<typeof voteRequestDto>;

/**
 * 투표 생성/수정 응답 타입
 */
export type VoteResponse = z.infer<typeof voteResponseDto>;
