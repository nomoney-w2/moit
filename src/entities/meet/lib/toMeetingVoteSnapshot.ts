import type { MeetResponse } from '@/entities/meet/dto/meet.dto';
// FSD 위반 carry-over: `MeetingVoteSnapshot` 타입은 `vote-rank-cards/lib/types` 에 정의돼 있어
// entities → features 역방향 의존이 발생한다. 본 작업(#73) 범위에서 타입 이전은 보류하고,
// 별도 정리 PR(specs/feat/073-vote-rank-cards-api/plan.md TODO-8)에서 `entities/meet/dto/`로 이전 예정.
import type { MeetingVoteSnapshot } from '@/features/vote-rank-cards/lib/types';

export interface ToMeetingVoteSnapshotOptions {
  /**
   * timeRange 가 누락된 입력에 대해 throw 할지 여부.
   * - true (default): 시간 모임만 처리. 호출자가 분기 책임.
   * - false: 의미 없는 fallback timeRange 로 변환 (운영 코드 사용 권장 안 함).
   */
  strict?: boolean;
}

/**
 * 서버 raw `voteTimeSlots` 를 고정 차원(dates × slotCount) 으로 정규화.
 * - 입력 row 길이가 expectedSlots 보다 짧으면 false 패딩, 길면 잘라냄.
 * - dates 와 voteTimeSlots row 의 인덱스 매핑은 server 응답 순서를 그대로 신뢰
 *   (모임 생성 시 클라가 정렬된 dates 를 보내고 server 가 그 순서로 저장·응답한다는 컨벤션).
 */
function normalizeVoteTimeSlots(
  raw: boolean[][] | undefined | null,
  expectedDates: number,
  expectedSlots: number,
): boolean[][] {
  return Array.from({ length: expectedDates }, (_, dateIndex) => {
    const row = raw?.[dateIndex] ?? [];
    return Array.from({ length: expectedSlots }, (_, slotIndex) =>
      Boolean(row[slotIndex]),
    );
  });
}

export function toMeetingVoteSnapshot(
  meet: MeetResponse,
  options: ToMeetingVoteSnapshotOptions = {},
): MeetingVoteSnapshot {
  const strict = options.strict ?? true;

  if (!meet.timeRange) {
    if (strict) {
      throw new Error(
        'toMeetingVoteSnapshot: timeRange is required. timeRange가 없는 모임은 캘린더 뷰로 분기되어야 함.',
      );
    }
  }

  const slotCount = meet.timeRange?.slotCount ?? 0;

  return {
    id: meet.id,
    title: meet.title,
    dates: meet.dates,
    status: meet.status,
    finalizedDate: meet.finalizedDate ?? null,
    maxParticipantCount: meet.maxParticipantCount ?? 0,
    hostName: meet.hostName,
    timeRange: meet.timeRange ?? {
      startTime: '00:00',
      endTime: '00:00',
      slotCount: 0,
    },
    participants: meet.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      voteDates: participant.voteDates,
      voteTimeSlots: normalizeVoteTimeSlots(
        participant.voteTimeSlots,
        meet.dates.length,
        slotCount,
      ),
      hasVoted: participant.hasVoted,
    })),
  };
}
