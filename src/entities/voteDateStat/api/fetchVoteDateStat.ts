import { VoteDateStat } from '../dto/voteDateStat.dto';

export type FetchVoteDateStatParams = {
  meetingId: string;
};

/**
 * @deprecated [#73, 2026-05-07] sandbox swagger 확인 결과 서버에 날짜 집계 전용 엔드포인트 부재.
 * Replacement: `buildVoteDateStat` (entities/voteDateStat/lib/) — `getMeetingById` 응답을 클라에서 집계.
 * Removal target: 별도 정리 PR (specs/feat/073-vote-rank-cards-api/plan.md TODO-9 참조).
 */
export async function fetchVoteDateStat(
  _params: FetchVoteDateStatParams,
): Promise<VoteDateStat[]> {
  throw new Error('fetchVoteDateStat is not implemented yet');
}
