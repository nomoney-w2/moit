# Phase 0 Research: vote-rank-cards API 연동

**Date**: 2026-05-07
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

---

## R-1. `GET /api/v1/meeting?meetId=X` 응답 스키마 정확 매핑

**Decision**: sandbox swagger(`https://sandbox-api.weddin.kr/v3/api-docs`) 기준 다음 스키마로 zod 정의.

```ts
// 확장될 meetResponseDto (core)
{
  id: string,
  title: string,
  hostName: string,
  dates: string[],                              // 'YYYY-MM-DD'
  status: 'VOTING' | 'FINALIZED' | 'CLOSED',
  finalizedDate: string | null,                 // null when status !== FINALIZED
  maxParticipantCount: number | null,
  timeRange: {                                  // optional/nullable on date-only meetings
    startTime: string,                          // 'HH:mm', 30min step
    endTime: string,
    slotCount: number,                          // ≥ 1
  } | null,
  participants: {
    id: number,
    name: string,
    voteDates: string[],                        // 'YYYY-MM-DD'
    voteTimeSlots: boolean[][],                 // dates.length × timeRange.slotCount
    hasVoted: boolean,
  }[],
}
```

**Rationale**:

- swagger의 `MeetingResponse` + `ParticipantResponse` 명시적으로 위 필드 모두 포함.
- `timeRange.slotCount`가 응답에 그대로 옴 → 클라이언트가 슬롯 길이를 별도 계산할 필요 없음.
- `voteTimeSlots`가 2D boolean이라 PR #72의 `MeetingVoteSnapshot.participants[].voteTimeSlots`와 1:1 매핑.

**Alternatives considered**:

- 별도 `voteTimeSlotStat` 집계 엔드포인트 사용 → swagger에 부재. 폐기.
- `MeetResponse`에 시간대 집계만 받고 raw vote 필요 시 N+1 호출 → 호출 수 증가, 폐기.

**Open**: 운영 환경 응답이 sandbox와 동일한지는 본 작업 통합 단계에서 실 호출 1회로 확인 필요(quickstart.md).

---

## R-2. `timeRange` 의 optionality

**Decision**: `meetResponseDto.timeRange` 는 zod에서 `.nullable().optional()` 양쪽 허용.

```ts
timeRange: timeRangeWithSlotCountDto.nullable().optional();
```

**Rationale**:

- 모임 생성 시 시간 범위 미선택이 가능 (`createMeetRequestDto.timeRange.optional()` 으로 이미 정의됨).
- 백엔드가 응답에서 (a) 필드 제거 / (b) `null` 반환 둘 중 어느 쪽이든 zod가 받아들이도록 안전 마진.
- TypeScript 타입은 `MeetingTimeRange | null | undefined` 가 되며, page.tsx 분기 조건은 `if (meetingData.timeRange) { ... }` 한 줄로 둘 다 false-y 처리 가능.

**Alternatives considered**:

- `.nullable()` 만 (필드는 존재, 값만 null) → 실 응답이 필드 제거 형태일 때 zod 검증 실패 위험.
- `.optional()` 만 (값이 null이면 검증 실패) → 백엔드가 null 반환 시 깨짐.

**Validation step**: 실 응답 1건으로 어느 형태인지 확정 후 더 엄격한 스키마로 좁힐 수 있음 (현재 안전 마진).

---

## R-3. `voteTimeSlots` 차원 보장

**Decision**: 어댑터에서 다음 fallback 정책 적용:

- `voteTimeSlots` 가 `undefined`/`null` → 빈 배열 `[]` 로 정규화.
- 각 행 길이가 `timeRange.slotCount`와 다르면 어댑터가 잘라내거나 false-패딩.
- timeRange 가 없는 모임에서는 `voteTimeSlots` 를 무시(어차피 결과 페이지가 캘린더 뷰로 분기).

```ts
function normalizeVoteTimeSlots(
  raw: boolean[][] | undefined | null,
  expectedDates: number,
  expectedSlots: number,
): boolean[][] {
  if (!raw)
    return Array.from({ length: expectedDates }, () =>
      Array(expectedSlots).fill(false),
    );
  return Array.from({ length: expectedDates }, (_, d) => {
    const row = raw[d] ?? [];
    return Array.from({ length: expectedSlots }, (_, s) => Boolean(row[s]));
  });
}
```

**Rationale**: 백엔드가 race condition (모임 시간 범위 변경 + 기존 투표 데이터 mismatch) 으로 차원이 안 맞는 응답을 줄 가능성 방어. PR #72의 `toRankedSlots`가 `Boolean(dateRow?.[slotIndex])` fallback을 이미 가지고 있어 어댑터에서 한 번 더 정규화하면 이중 보호.

**Alternatives considered**:

- zod에서 차원 검증 → `slotCount` 알기 위한 cross-field 검증 복잡도 vs 효용 낮음.
- 어댑터에서 throw → 사용자에게는 무용한 에러. 폐기.

---

## R-4. `parseISO` vs `parseDate` 일관성

**Decision**: 본 작업 신규 코드(어댑터·page 분기)는 `shared/lib/date.ts` 의 `parseDate` 사용. PR #72 기존 코드의 `parseISO`는 별도 정리 PR 대상으로 유지.

**Rationale**:

- 코드리뷰 검증 결과 date-fns 4.1의 `parseISO('YYYY-MM-DD')`는 로컬 자정 반환으로 `parseDate`와 동등하게 동작 (`format()` 결과 timezone 무관 동일). 회귀 위험 없음.
- 그러나 프로젝트 컨벤션상 `parseDate`로 일원화돼 있고, 1422f98 커밋에서 `new Date(YYYY-MM-DD)` 의 day-shift를 잡은 직후라 동일 헬퍼 사용이 안전.
- 일괄 변경 시 import 사이트 5+개 동시 수정. 본 spec 범위 비대화 우려.

**Alternatives considered**:

- 본 작업에서 일괄 교체 → 결합도 큰 변경, 회귀 위험.
- 그대로 방치 → 일관성 비용 누적.

---

## R-5. 토글 영속화 미사용 결정 재확인

**Decision**: `useViewMode` 의 초기값을 `'table'` 로 두고 새로고침 시 표 뷰로 복귀. localStorage 등 영속화 안 함.

**Rationale**: spec Clarifications 결정. 첫 인상 일관성 > 개인화. 향후 사용자 피드백 누적 시 추가 고려 (TODO-4).

---

## R-6. `meet-result-table` ↔ `vote-rank-cards` 의 결합 회로

**Finding**: `MeetResultTablePage` 가 다음을 직접 import:

- `features/vote-rank-cards/lib/toRankedSlots`
- `features/vote-rank-cards/lib/types` (`MeetingVoteSnapshot`)
- `features/vote-rank-cards/model/useVoteRankCardToggle`
- `features/vote-rank-cards/ui/VoteRankCardEmptyState`
- `features/vote-rank-cards/ui/VoteRankCardList`

**Decision**: 본 spec에서는 결합 회로를 **그대로 유지**하고 `MeetResultTablePage` 에 데이터 입력만 실 어댑터로 교체. FSD 위반 해소(widget 추출 또는 타입 이전)는 TODO-7·8로 별도 PR.

**Rationale**: 본 spec의 핵심 SC-001(mock→실 데이터 일치) 와 무관한 변경. 동시 진행 시 회귀 면적 비대.

---

## R-7. timeRange-less 모임의 캘린더 뷰 어댑터

**Decision**: 새 함수 `entities/voteDateStat/lib/buildVoteDateStat.ts` 작성.

```ts
// 입력: MeetResponse (timeRange 없음)
// 출력: VoteDateStat[] (각 후보 날짜에 can/cannot 사람 명단)
//
// 알고리즘:
// 1. snapshot.participants 중 hasVoted=true 만 사용
// 2. 각 후보 날짜에 대해, 참여자가 voteDates 에 그 날짜를 포함하면 can[], 아니면 cannot[]
```

**Rationale**: `VoteResultsShell` + `ReactDatepicker` (vote-results-calendar feature) 가 이미 `VoteDateStat[]` 입력 형태로 확립돼 있음. 신규 어댑터로 raw → 입력 변환만 책임 분리.

**Alternatives considered**:

- 캘린더 뷰도 timeRange 있는 모임처럼 시간대 1개 가상화하여 `MeetResultTablePage` 통합 → UX 불일치 (사용자가 시간 안 정한 모임에서 시간 슬롯 보는 혼란).
- 백엔드 `fetchVoteDateStat` 구현 → swagger에 엔드포인트 부재.

---

## R-8. Deprecation 주석 형식 표준화

**Decision**: 다음 통일 포맷:

```ts
/**
 * @deprecated [#73, 2026-05-07] {짧은 사유}.
 * Replacement: {새 경로 또는 'N/A'}
 * Removal target: 별도 정리 PR (specs/feat/073-vote-rank-cards-api/plan.md TODO-9 참조).
 */
```

**Rationale**:

- `@deprecated` JSDoc 태그로 IDE에서 strikethrough 자동 표시.
- 이슈 번호·날짜 명시로 회수 시점 추적 가능.
- Replacement 명시로 신규 사용자에게 대체 경로 제공.

---

## 결정 요약

| ID  | 결정                                                                   | 영향                 |
| --- | ---------------------------------------------------------------------- | -------------------- |
| R-1 | meetResponseDto 확장 (voteTimeSlots, timeRange, status, finalizedDate) | DTO 변경 1건         |
| R-2 | timeRange 는 `.nullable().optional()`                                  | zod 안전 마진        |
| R-3 | 어댑터에서 voteTimeSlots 차원 정규화                                   | 방어 코드 1개        |
| R-4 | 신규 코드만 parseDate, 기존 parseISO 유지                              | style 일관성 PR 별도 |
| R-5 | 토글 영속화 미사용                                                     | 추가 코드 0          |
| R-6 | feature ↔ feature import 유지 (FSD 위반 carry-over)                    | TODO-7·8             |
| R-7 | timeRange-less 폴백 = 캘린더 뷰 + 새 어댑터                            | 신규 파일 1          |
| R-8 | deprecation 주석 표준 포맷                                             | 6+ 곳 적용           |
