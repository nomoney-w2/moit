import type { MeetResponse } from '@/entities/meet/dto/meet.dto';
import type {
  TimeSlotCell,
  VoteTimeSlotStat,
} from '@/entities/voteTimeSlotStat/dto/voteTimeSlotStat.dto';

/**
 * `MeetResponse` 의 raw 투표 데이터를 시간대 셀 집계(`VoteTimeSlotStat`) 로 변환.
 *
 * dates 와 voteTimeSlots row 의 인덱스 매핑은 server 응답 순서를 그대로 신뢰한다
 * (모임 생성 시 클라가 정렬된 dates 를 보내고 server 가 그 순서로 저장·응답).
 */
export function buildVoteTimeSlotStat(meet: MeetResponse): VoteTimeSlotStat {
  if (!meet.timeRange) {
    throw new Error(
      'buildVoteTimeSlotStat: timeRange is required. timeRange가 없는 모임은 별도 buildVoteDateStat 어댑터를 사용해야 함.',
    );
  }

  const slotCount = meet.timeRange.slotCount;
  const votedParticipants = meet.participants.filter((p) => p.hasVoted);

  const cells: TimeSlotCell[] = [];
  for (let dateIndex = 0; dateIndex < meet.dates.length; dateIndex += 1) {
    const date = meet.dates[dateIndex];
    for (let slotIdx = 0; slotIdx < slotCount; slotIdx += 1) {
      const ablePeople = votedParticipants
        .filter((p) => Boolean(p.voteTimeSlots?.[dateIndex]?.[slotIdx]))
        .map((p) => ({ id: p.id, name: p.name }));
      cells.push({
        date,
        slotIdx,
        count: ablePeople.length,
        participants: ablePeople,
      });
    }
  }

  return {
    meetingId: meet.id,
    dates: meet.dates,
    cells,
    allParticipants: votedParticipants.map((p) => ({
      id: p.id,
      name: p.name,
    })),
  };
}
