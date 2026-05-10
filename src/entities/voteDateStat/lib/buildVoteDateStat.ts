import type { MeetResponse } from '@/entities/meet/dto/meet.dto';
import type { VoteDateStat } from '@/entities/voteDateStat/dto/voteDateStat.dto';
import type { Person } from '@/shared/types/common';

/**
 * `MeetResponse` 의 raw 투표 데이터를 날짜 단위 집계(`VoteDateStat[]`) 로 변환.
 *
 * dates 순서는 server 응답을 그대로 신뢰한다 (모임 생성 시 클라가 정렬된 dates 를 보내고
 * server 가 그 순서로 저장·응답한다는 컨벤션. buildVoteTimeSlotStat / toMeetingVoteSnapshot
 * 과 동일 정책).
 */
export function buildVoteDateStat(meet: MeetResponse): VoteDateStat[] {
  const votedParticipants = meet.participants.filter((p) => p.hasVoted);

  return meet.dates.map((date) => {
    const can: Person[] = [];
    const cannot: Person[] = [];
    for (const participant of votedParticipants) {
      const person: Person = {
        id: String(participant.id),
        name: participant.name,
      };
      if (participant.voteDates.includes(date)) {
        can.push(person);
      } else {
        cannot.push(person);
      }
    }
    return { date, can, cannot };
  });
}
