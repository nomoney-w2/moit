/**
 * @deprecated [#73, 2026-05-07] 개발용 라우트. 운영 결과 페이지는 `/meet/[meetingId]` 사용.
 * 시각 회귀 검증은 Storybook(`Features/VoteRankCards/*`) 으로 충분.
 * Removal target: 별도 정리 PR (specs/feat/073-vote-rank-cards-api/plan.md TODO-9 참조).
 */
import { mockMeetingVoteSnapshot } from '@/features/vote-rank-cards/lib/mock';
import VoteRankCardsPage from '@/features/vote-rank-cards/ui/VoteRankCardsPage';

export default function VoteRankCardsTestPage() {
  return <VoteRankCardsPage snapshot={mockMeetingVoteSnapshot} />;
}
