import { mockMeetingVoteSnapshot } from '@/features/vote-rank-cards/lib/mock';
import VoteRankCardsPage from '@/features/vote-rank-cards/ui/VoteRankCardsPage';

export default function VoteRankCardsTestPage() {
  return <VoteRankCardsPage snapshot={mockMeetingVoteSnapshot} />;
}
