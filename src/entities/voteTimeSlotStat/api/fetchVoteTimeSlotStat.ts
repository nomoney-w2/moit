import { type VoteTimeSlotStat } from '../dto/voteTimeSlotStat.dto';

export type FetchVoteTimeSlotStatParams = {
  meetingId: string;
};

/**
 * @deprecated [#73, 2026-05-07] sandbox swagger 확인 결과 서버에 시간대 집계 전용 엔드포인트 부재.
 * Replacement: `buildVoteTimeSlotStat` (entities/voteTimeSlotStat/lib/) — `getMeetingById` 응답을 클라에서 집계.
 * Removal target: 별도 정리 PR (specs/feat/073-vote-rank-cards-api/plan.md TODO-9 참조).
 */
export async function fetchVoteTimeSlotStat(
  _params: FetchVoteTimeSlotStatParams,
): Promise<VoteTimeSlotStat> {
  throw new Error('fetchVoteTimeSlotStat is not implemented yet');
}
