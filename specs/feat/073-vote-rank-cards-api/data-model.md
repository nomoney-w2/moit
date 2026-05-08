# Phase 1 Data Model: vote-rank-cards API 연동

**Date**: 2026-05-07
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

---

## 1. 확장된 `meetResponseDto` (서버 → 클라 raw)

> **위치**: `src/entities/meet/dto/meet.dto.ts`
> **변경 종류**: 기존 zod 스키마에 필드 4개 추가, `participantDto`에 1개 추가.

### Before (현재)

```ts
export const participantDto = z.object({
  id: z.number(),
  name: z.string(),
  voteDates: z.array(z.string()),
  hasVoted: z.boolean(),
});

export const meetResponseDto = z.object({
  id: z.string(),
  title: z.string(),
  dates: z.array(z.string()),
  maxParticipantCount: z.number().nullable(),
  participants: z.array(participantDto),
  hostName: z.string(),
});
```

### After (본 작업 적용)

```ts
// 기존 timeRangeDto 에 slotCount 포함된 변형 신규 정의
export const timeRangeWithSlotCountDto = z.object({
  startTime: z.string().regex(TIME_PATTERN),
  endTime: z.string().regex(TIME_PATTERN),
  slotCount: z.number().int().min(1),
});

export const participantDto = z.object({
  id: z.number(),
  name: z.string(),
  voteDates: z.array(z.string()),
  voteTimeSlots: z.array(z.array(z.boolean())).default([]), // ➕
  hasVoted: z.boolean(),
});

export const meetingStatusEnum = z.enum(['VOTING', 'FINALIZED', 'CLOSED']);

export const meetResponseDto = z.object({
  id: z.string(),
  title: z.string(),
  dates: z.array(z.string()),
  status: meetingStatusEnum, // ➕
  finalizedDate: z.string().nullable().optional(), // ➕
  maxParticipantCount: z.number().nullable(),
  participants: z.array(participantDto),
  hostName: z.string(),
  timeRange: timeRangeWithSlotCountDto.nullable().optional(), // ➕
});
```

### 영향받는 호출 사이트

| 파일                                          | 영향      | 조치                                                                    |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------- |
| `src/entities/meet/api/getMeetingById.ts`     | 자동      | 타입 추론으로 `MeetResponse` 새 필드 자동 노출                          |
| `src/app/meet/[meetingId]/page.tsx`           | ✏️        | `buildMockSnapshot(meetingData)` → `toMeetingVoteSnapshot(meetingData)` |
| `src/features/meet-create/...`                | ✅ 없음   | createMeetRequestDto만 사용, response 사용 안 함                        |
| `src/entities/meet/api/meet.query.example.ts` | 검토 필요 | 응답 모의 데이터가 새 필드 누락 시 추가                                 |

---

## 2. `MeetingVoteSnapshot` (어댑터 출력 = 컴포넌트 입력)

> **위치**: `src/features/vote-rank-cards/lib/types.ts` (기존 위치 유지, TODO-8)
> **변경 종류**: 변경 없음. 기존 타입 그대로 재사용.

```ts
// 기존 (PR #72에서 도입, 변경 없음)
export interface MeetingVoteSnapshot {
  id: string;
  title: string;
  dates: IsoDate[];
  status: MeetingStatus;
  finalizedDate?: IsoDate | null;
  maxParticipantCount: number;
  participants: ParticipantVote[];
  hostName: string;
  timeRange: MeetingTimeRange; // ⚠️ 비-optional. 어댑터에서 timeRange 없는 경우 호출 안 함.
}
```

### 어댑터 호출 분기

```tsx
// app/meet/[meetingId]/page.tsx 패턴
if (meetingData.timeRange) {
  const snapshot = toMeetingVoteSnapshot(meetingData); // timeRange 보장됨
  // ... MeetResultTablePage 렌더
} else {
  const dateStats = buildVoteDateStat(meetingData);
  // ... 캘린더 뷰 렌더
}
```

---

## 3. `toMeetingVoteSnapshot` 어댑터 (entities)

> **위치**: `src/entities/meet/lib/toMeetingVoteSnapshot.ts` (➕ 신규)
> **책임**: `MeetResponse` (timeRange 보장된 분기) → `MeetingVoteSnapshot`

### 시그니처

```ts
import type { MeetResponse } from '@/entities/meet/dto/meet.dto';
import type { MeetingVoteSnapshot } from '@/features/vote-rank-cards/lib/types';

export interface ToMeetingVoteSnapshotOptions {
  /** timeRange가 누락된 경우 throw할지 fallback default를 쓸지 */
  strict?: boolean; // default true
}

export function toMeetingVoteSnapshot(
  meet: MeetResponse,
  options?: ToMeetingVoteSnapshotOptions,
): MeetingVoteSnapshot;
```

### 변환 규칙

| 필드                           | 출처                            | 비고                                                                                          |
| ------------------------------ | ------------------------------- | --------------------------------------------------------------------------------------------- |
| `id`                           | `meet.id`                       | 그대로                                                                                        |
| `title`                        | `meet.title`                    | 그대로                                                                                        |
| `dates`                        | `[...meet.dates].sort()`        | sort: 날짜 오름차순 보장                                                                      |
| `status`                       | `meet.status`                   | enum 그대로                                                                                   |
| `finalizedDate`                | `meet.finalizedDate ?? null`    | undefined → null 정규화                                                                       |
| `maxParticipantCount`          | `meet.maxParticipantCount ?? 0` | null → 0 fallback                                                                             |
| `hostName`                     | `meet.hostName`                 | 그대로                                                                                        |
| `timeRange`                    | `meet.timeRange`                | strict 모드: null/undefined면 throw. fallback 모드: 기본 timeRange 합성 (운영에선 호출 안 됨) |
| `participants[].id`            | `participant.id`                | number 유지                                                                                   |
| `participants[].name`          | `participant.name`              | 그대로                                                                                        |
| `participants[].voteDates`     | `participant.voteDates`         | 그대로                                                                                        |
| `participants[].voteTimeSlots` | `normalizeVoteTimeSlots(...)`   | R-3 정규화                                                                                    |
| `participants[].hasVoted`      | `participant.hasVoted`          | 그대로                                                                                        |

### Edge case 처리

- `participants` 비어 있음 → 그대로 빈 배열 (`toRankedSlots` 가 isEmpty 처리).
- `participants[].voteTimeSlots` 차원 mismatch → `normalizeVoteTimeSlots`로 dates × slotCount 격자에 맞춤 (R-3).
- `timeRange.slotCount === 0` → 비합리적 데이터, strict 모드 throw.

---

## 4. `buildVoteTimeSlotStat` 어댑터 (entities)

> **위치**: `src/entities/voteTimeSlotStat/lib/buildVoteTimeSlotStat.ts` (➕ 신규)
> **책임**: `MeetResponse` (timeRange 보장) → `VoteTimeSlotStat` (히트맵 입력)

### 시그니처

```ts
import type { MeetResponse } from '@/entities/meet/dto/meet.dto';
import type { VoteTimeSlotStat } from '@/entities/voteTimeSlotStat/dto/voteTimeSlotStat.dto';

export function buildVoteTimeSlotStat(meet: MeetResponse): VoteTimeSlotStat;
```

### 변환 규칙

```ts
// 입력 raw에서 cells[] 만들기
const votedParticipants = meet.participants.filter((p) => p.hasVoted);
const cells = [];
for (let d = 0; d < meet.dates.length; d++) {
  for (let s = 0; s < meet.timeRange.slotCount; s++) {
    const ablePeople = votedParticipants
      .filter((p) => p.voteTimeSlots[d]?.[s])
      .map((p) => ({ id: p.id, name: p.name }));
    cells.push({
      date: meet.dates[d],
      slotIdx: s,
      count: ablePeople.length,
      participants: ablePeople,
    });
  }
}

return {
  meetingId: meet.id,
  dates: [...meet.dates].sort(),
  cells,
  allParticipants: votedParticipants.map((p) => ({ id: p.id, name: p.name })),
};
```

### `VoteTimeSlotStat` (기존 dto 변경 없음)

```ts
// src/entities/voteTimeSlotStat/dto/voteTimeSlotStat.dto.ts (현재 그대로)
export const voteTimeSlotStatDto = z.object({
  meetingId: z.string(),
  dates: z.array(z.string()),
  cells: z.array(timeSlotCellDto),
  allParticipants: z.array(z.object({ id: z.number(), name: z.string() })),
});
```

---

## 5. `buildVoteDateStat` 어댑터 (entities, timeRange-less 폴백)

> **위치**: `src/entities/voteDateStat/lib/buildVoteDateStat.ts` (➕ 신규)
> **책임**: `MeetResponse` → `VoteDateStat[]` (날짜 캘린더 뷰 입력)

### 시그니처

```ts
import type { MeetResponse } from '@/entities/meet/dto/meet.dto';
import type { VoteDateStat } from '@/entities/voteDateStat/dto/voteDateStat.dto';

export function buildVoteDateStat(meet: MeetResponse): VoteDateStat[];
```

### 변환 규칙

```ts
const votedParticipants = meet.participants.filter((p) => p.hasVoted);
return [...meet.dates].sort().map((date) => {
  const can = [];
  const cannot = [];
  for (const p of votedParticipants) {
    const person = { id: p.id, name: p.name };
    if (p.voteDates.includes(date)) can.push(person);
    else cannot.push(person);
  }
  return { date, can, cannot };
});
```

### `VoteDateStat` (기존 type 변경 없음)

```ts
// src/entities/voteDateStat/dto/voteDateStat.dto.ts (현재 그대로)
export type VoteDateStat = {
  date: string;
  can: Person[];
  cannot: Person[];
};
```

---

## 6. 데이터 흐름 다이어그램

```
GET /api/v1/meeting?meetId=X
       │
       ▼
   ky.get + zod validateSchema
       │
       ▼  MeetResponse (확장된 DTO)
       │
       ├──── timeRange 있음 ────►  toMeetingVoteSnapshot()  ─►  MeetingVoteSnapshot
       │                          buildVoteTimeSlotStat()  ─►  VoteTimeSlotStat
       │                                       │
       │                                       ▼
       │                            MeetResultTablePage
       │                              ├─ useViewMode='table' ─► ResultTableView (Heatmap)
       │                              └─ useViewMode='cards'  ─► VoteRankCardList
       │
       └──── timeRange 없음 ───►  buildVoteDateStat()  ─►  VoteDateStat[]
                                                │
                                                ▼
                                  VoteResultsShell + ReactDatepicker
```

---

## 7. 단위 테스트 매트릭스

| 어댑터                  | 테스트 케이스 (필수)                                                                                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `toMeetingVoteSnapshot` | (a) 정상 변환 9명·4슬롯 (b) participants=[] (c) voteTimeSlots 차원 mismatch fallback (d) timeRange null + strict=true → throw                                                                                                                                                              |
| `buildVoteTimeSlotStat` | (a) 셀 수 = dates × slotCount (b) hasVoted=false 제외 (c) 모든 셀 0표 (d) timeRange.slotCount=1 단일 셀                                                                                                                                                                                    |
| `buildVoteDateStat`     | (a) date별 can/cannot 분류 (b) hasVoted=false 제외 (c) dates 정렬 보장 (d) 모든 참여자 voteDates=[]                                                                                                                                                                                        |
| `rankSlots` (기존)      | ➕ **과거 날짜 보조정렬 1케이스** (FR-011, SC-006). "과거"의 정의: **today 이전** — `compareSlot` 의 `isBefore(aDate, todayDate)` 동작에 따라 today **당일은 future 그룹**. 테스트 케이스는 `TODAY = 'YYYY-MM-DD'` 기준으로 today-1 슬롯을 future 그룹(today+N) 보다 뒤에 정렬되는지 검증. |

---

## 8. 타입 호환성 검증 체크리스트

본 spec 적용 후 다음이 컴파일/런타임 통과해야 함:

- [ ] `toMeetingVoteSnapshot(meet).participants[].voteTimeSlots[d][s]` 가 `boolean` 타입
- [ ] `MeetResultTablePage` props 시그니처 변경 없음
- [ ] `MeetingVoteSnapshot.timeRange` 가 비-optional 유지 (어댑터 단계에서 보장)
- [ ] `meet.query.example.ts` mock 응답이 새 필드 포함하도록 갱신 (단위 테스트 깨지지 않게)
