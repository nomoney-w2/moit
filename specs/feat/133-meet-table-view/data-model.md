# Phase 1 Data Model: 모임 테이블뷰 화면

**Feature**: feat/#133-meet-table-view | **Date**: 2026-04-30

## Entities

### 1. `VoteTimeSlotStat` (NEW)

모임 단위로 모든 (날짜, 30분 슬롯) 셀의 가능 인원수를 담는다.

**Location**: `src/entities/voteTimeSlotStat/dto/voteTimeSlotStat.dto.ts`

**Schema (zod)**:

```typescript
import { z } from 'zod';

export const timeSlotCellDto = z.object({
  /** YYYY-MM-DD */
  date: z.string(),
  /**
   * 0 = 09:00–09:30, 1 = 09:30–10:00, ..., 23 = 20:30–21:00
   * START_HOUR(=9)부터 30분 간격으로 0-based index.
   */
  slotIdx: z.number().int().min(0).max(23),
  /** 해당 슬롯에 가능하다고 투표한 참여자 수 (0 이상) */
  count: z.number().int().min(0),
  /** 해당 슬롯에 가능한 참여자 ID/이름 */
  participants: z.array(z.object({ id: z.number(), name: z.string() })),
});

export const voteTimeSlotStatDto = z.object({
  meetingId: z.string(),
  /** 모임의 후보 날짜(정렬되어 있다고 가정). UI는 이 순서대로 컬럼 배치 */
  dates: z.array(z.string()),
  /** 셀 정보. 비어 있는 셀(count=0)도 포함될 수 있고, 누락되어도 UI는 0으로 간주 */
  cells: z.array(timeSlotCellDto),
});

export type TimeSlotCell = z.infer<typeof timeSlotCellDto>;
export type VoteTimeSlotStat = z.infer<typeof voteTimeSlotStatDto>;
```

**Key Properties**:

- `dates[]`은 모임의 후보 날짜 전체. 컬럼 순서.
- `cells[]`은 sparse 가능 — 빈 셀은 자동 0 처리.
- `slotIdx`는 0~23 (9시 ~ 21시, 24개 슬롯). 24개 미만 데이터도 허용(누락 슬롯은 0).
- `participants[]`은 UI 본 명세에서는 사용하지 않으나 데이터 보유(추후 셀 탭 인터랙션에서 사용).

**Validation Rules**:

- `count === participants.length` 일관성은 백엔드 책임. 클라이언트는 `count`만 사용.
- `date`는 `dates[]`에 포함된 값이어야 함(아니면 무시).

---

### 2. `Meeting` (REUSE)

기존 `entities/meet/dto/meet.dto.ts`의 `MeetResponse`. 그대로 재사용.

**Used Fields**:

- `id`, `title`, `hostName` — 헤더 표시
- `dates: string[]` — 후보 날짜
- `participants[]` — `hasVoted` 카운트로 "{N}명이 투표했어요" 산출

**Note**: 본 명세는 `participants[].voteDates`(날짜만)는 캘린더뷰 전환 시에만 사용(기존 `getStatsFromParticipants`로 `VoteDateStat`으로 변환).

---

### 3. `VoteDateStat` (REUSE for calendar toggle)

기존 `entities/voteDateStat/dto/voteDateStat.dto.ts`. 토글 시 표시되는 캘린더뷰(`VoteResultDataView`)에 그대로 전달.

```typescript
export type VoteDateStat = {
  date: string;
  can: Person[];
  cannot: Person[];
};
```

본 명세에서는 변경 없음.

---

### 4. `HeatmapIntensityMap` (Derived, lib only)

순수 계산 결과 — 셀별 농도 단계. **DTO 아님**(저장·전송 없음).

**Location**: `src/features/meet-result-table/lib/computeHeatmapIntensity.ts`

**Type**:

```typescript
export type OpacityLevel = 100 | 70 | 50 | 30 | 10;

/** cellKey "{date}_{slotIdx}" → 농도(또는 null = 베이스) */
export type HeatmapIntensityMap = Map<string, OpacityLevel | null>;
```

**Computation** (research.md R-003 정책):

1. 입력: `cells: TimeSlotCell[]`
2. `count > 0` 셀만 필터
3. distinct count 내림차순 정렬 → `[d1, d2, d3, ...]`
4. 각 셀의 rank = `distinctCounts.indexOf(cell.count)` (0-based)
5. `rank < 5` ? `[100, 70, 50, 30, 10][rank]` : `null`
6. `count === 0` 셀 → `null`

**Edge cases handled**:

- 모든 셀 0명 → 모두 null
- distinct count 1종(예: 모두 5명) → 100%만 적용, 그 외 없음
- 5위 동률 N개 → 모두 10%

---

## Relationships

```
Meeting (existing)
├── id (string) ────────── used as key for fetching VoteTimeSlotStat
├── dates (string[]) ───── columns of HeatmapGrid
├── hostName + title ──── ParticipantHeader display
└── participants[]
    ├── hasVoted ──────── ResultCountBar count
    └── voteDates ─────── VoteDateStat (existing pipeline) for calendar toggle

VoteTimeSlotStat (NEW)
├── meetingId ──────────── FK to Meeting
├── dates[] ───────────── 일관성 위해 Meeting.dates와 동일해야 함 (mock이 동기화)
└── cells[]
    └── (date, slotIdx, count, participants[])
                      └── computeHeatmapIntensity → HeatmapIntensityMap

HeatmapIntensityMap (derived)
└── consumed by HeatmapCell to apply Tailwind opacity class
```

---

## Mock Data Strategy

**Location**: `src/entities/voteTimeSlotStat/lib/mock.ts`

**Function**: `generateMockVoteTimeSlotStat(meetingId: string, dates: string[], participants: { id: number, name: string }[]): VoteTimeSlotStat`

**Determinism**: 같은 `(meetingId, dates)` 입력에 대해 항상 같은 결과 (개발 안정성). 의사난수 시드로 `meetingId` 해시 사용.

**Distribution**:

- 약 30%의 셀은 `count = 0` (베이스 톤 케이스 검증)
- 약 60%의 셀은 1~참여자수의 절반 (중간 농도 검증)
- 약 10%의 셀은 참여자수의 절반~전체 (1위 후보)
- distinct count 5종 이상 보장(농도 5단계 모두 노출)

**Storybook 활용**: 같은 mock 함수를 Storybook에서 호출해 다양한 시나리오(0명 모임, 동률 모임, 풀 투표 모임) 카드 변형 노출.

---

## Constants

**Location**: `src/features/meet-result-table/lib/timeSlotConstants.ts`

```typescript
export const START_HOUR = 9;
export const END_HOUR = 21;
export const SLOTS_PER_HOUR = 2;
export const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR; // 24

export const OPACITY_LEVELS = [100, 70, 50, 30, 10] as const;
export const OPACITY_LEVELS_MAX = OPACITY_LEVELS.length; // 5

/** Tailwind 클래스 매핑 (primary 색 #3C7EFA 기준) */
export const OPACITY_CLASS_MAP: Record<number, string> = {
  100: 'bg-[#3C7EFA]',
  70: 'bg-[#3C7EFA]/70',
  50: 'bg-[#3C7EFA]/50',
  30: 'bg-[#3C7EFA]/30',
  10: 'bg-[#3C7EFA]/10',
};
export const BASE_TONE_CLASS = 'bg-[#3C7EFA]/[0.04]'; // 베이스 톤 (또는 투명)
```

색상 토큰은 추후 디자인 시스템 정합 시 `primary-default` 변수로 치환.

---

## Cell Key Format

**Location**: `src/features/meet-result-table/lib/slotKey.ts`

```typescript
/** "YYYY-MM-DD_slotIdx" 형식 */
export function cellKey(date: string, slotIdx: number): string {
  return `${date}_${slotIdx}`;
}

export function parseCellKey(key: string): { date: string; slotIdx: number } {
  const [date, slotIdxStr] = key.split('_');
  return { date, slotIdx: Number(slotIdxStr) };
}
```

`computeHeatmapIntensity`의 입력/출력 Map 키, `<HeatmapCell>` `key` prop에 동일하게 사용.
