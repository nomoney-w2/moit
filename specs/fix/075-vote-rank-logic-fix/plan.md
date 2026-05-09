# Implementation Plan: VoteRankCardList 순위 뱃지 로직 버그 수정

**Branch**: `fix/#75-vote-rank-logic-fix` | **Date**: 2026-05-09  
**Spec**: `specs/fix/075-vote-rank-logic-fix/spec.md`  
**GitHub Issue**: #75

---

## Summary

`rankSlots` 함수가 경쟁 순위(competition ranking, 1224 방식)를 사용하여, 1위 동률 슬롯이 6개 이상이면 다음 득표 그룹이 7위 이상으로 계산돼 뱃지가 미표시되는 버그를 수정한다. **밀집 순위(dense ranking)** 로 전환하고, 폐지된 전원 동률 5개 truncation 로직을 제거하며, 0표 슬롯을 결과 리스트에서 제외한다.

변경 범위는 `vote-rank-cards` feature의 `lib/` 하위 순수 함수와 테스트 파일 5개로 한정된다. UI 컴포넌트(`VoteRankCard`, `VoteRankCardList`)는 변경 없음.

---

## Technical Context

**Language/Version**: TypeScript 5  
**Primary Dependencies**: date-fns (날짜 정렬), Vitest (단위 테스트)  
**Storage**: N/A — 클라이언트 순수 연산만  
**Testing**: Vitest  
**Target Platform**: Next.js 16 (App Router), React 19  
**Project Type**: 단일 Next.js 앱 (`src/`)  
**Performance Goals**: 순수 함수 → 성능 문제 없음  
**Constraints**: 기존 API 인터페이스(`SlotCount` 입력, `RankedSlotMeta[]` 출력) 유지  
**Scale/Scope**: 단위 함수 수정 + 테스트 업데이트 (5개 파일)

---

## Constitution Check

| Gate                   | Status  | 근거                                                                            |
| ---------------------- | ------- | ------------------------------------------------------------------------------- |
| FSD 레이어 준수        | ✅ Pass | 변경 파일이 모두 `features/vote-rank-cards/lib/` 내 순수 함수. 레이어 위반 없음 |
| 배럴 패턴 없음         | ✅ Pass | 기존 import 경로 유지, 새 barrel 추가 없음                                      |
| 단방향 의존            | ✅ Pass | `lib/` → 외부 의존 없음 (date-fns만 사용)                                       |
| 컴포넌트 function 선언 | ✅ Pass | UI 파일 수정 없음                                                               |
| No `adapters/`         | ✅ Pass | 해당 없음                                                                       |

**GATE RESULT: ALL PASS** — Phase 1 진행 가능

---

## Phase 0 — Research

### 미확인 사항 (기존 코드 탐색 결과)

| 항목                                  | 조사 결과                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------- |
| `isAllTie` 필드 UI 참조 여부          | UI 컴포넌트(`.tsx`) 어디서도 참조 없음. 테스트에서만 사용 → **제거 가능** |
| `rankSlots` 외부 호출자               | `toRankedSlots.ts`에서만 호출                                             |
| `toRankedSlots` 외부 호출자           | `VoteRankCardsPage.tsx`(@deprecated), `MeetResultTablePage.tsx` 두 곳     |
| `VoteRankCardList` 0표 카드 렌더 여부 | 현재 0표 슬롯도 `result.slots`에 포함되어 렌더됨                          |
| `RankedListResult.isAllTie` 의미 변화 | truncation 폐지 후 더 이상 UI 로직에 영향 없음 → 타입에서 제거            |

### Architecture Decision: dense ranking 위치

**결정**: `rankSlots.ts` 내부에서 dense ranking으로 전환. `toRankedSlots.ts`는 변경 최소화.

**근거**:

- `rankSlots`가 랭킹 알고리즘의 단일 진실 원천
- dense ranking은 랭킹 "계산"이므로 `lib/rankSlots.ts` 책임 범위
- 호출자(`toRankedSlots`)는 랭킹 결과를 소비하기만 함

**기각된 대안**: toRankedSlots 내에서 rank 재계산 → 관심사 분리 위반

### Architecture Decision: 0표 슬롯 필터링 위치

**결정**: `toRankedSlots.ts`에서 필터링 (orderedSlots 구성 시 canCount=0 슬롯 skip)

**근거**:

- `rankSlots`는 순위 계산 함수이므로 "표시 여부" 결정은 책임 밖
- `toRankedSlots`가 표시용 데이터를 조립하는 레이어
- 기존 `rankSlots` 인터페이스(`RankedSlotMeta`) 변경 불필요

---

## Phase 1 — Design & Contracts

### 변경 대상 파일 (5개)

이 버그 수정은 API 엔드포인트나 새 파일이 없다. 수정 대상만 명시한다.

```text
src/features/vote-rank-cards/
├── lib/
│   ├── rankSlots.ts          [MODIFY] 핵심: dense ranking + truncation 제거
│   ├── rankSlots.test.ts     [MODIFY] 테스트 케이스 기대값 갱신
│   ├── toRankedSlots.ts      [MODIFY] 0표 슬롯 필터링 + isAllTie 제거
│   ├── toRankedSlots.test.ts [MODIFY] 테스트 케이스 기대값 갱신
│   └── types.ts              [MODIFY] RankedListResult에서 isAllTie 제거
```

### Data Model 변경

**`RankedListResult` (types.ts)**:

- `isAllTie: boolean` 필드 제거

**`RankedSlotMeta` (rankSlots.ts)** — 변경 없음:

```typescript
interface RankedSlotMeta {
  id: TimeSlotId;
  rank: number | null; // dense rank (1,2,3,...) or null if ≥ threshold
  visible: boolean; // always true now (0표 필터는 toRankedSlots에서)
}
```

### 함수별 변경 명세

#### `rankSlots.ts`

**제거**:

- `MAX_VISIBLE_ON_FULL_TIE` 상수 제거
- `isAllTie` 분기 (lines 56-73) 전체 제거

**변경**: competition ranking → dense ranking

```typescript
// BEFORE (competition ranking):
const groupRank = cursor + 1;

// AFTER (dense ranking):
let denseRank = 0;
// ...loop 시작 시:
denseRank += 1;
const groupRank = denseRank;
```

**결과**: 0표 슬롯은 여전히 `{ rank: null, visible: true }` 로 반환 (필터링은 toRankedSlots 담당)

#### `toRankedSlots.ts`

**변경 1**: orderedSlots 구성 시 0표 슬롯 제외

```typescript
// BEFORE:
for (const meta of ranked) {
  if (!meta.visible) continue;
  const entry = slotMap.get(meta.id);
  ...
}

// AFTER:
for (const meta of ranked) {
  if (!meta.visible) continue;
  const entry = slotMap.get(meta.id);
  if (!entry) continue;
  if (entry.canCount === 0) continue;  // 0표 슬롯 제외
  ...
}
```

**변경 2**: `isAllTie` 계산 및 반환 제거

#### `types.ts`

```typescript
// BEFORE:
export interface RankedListResult {
  ...
  isAllTie: boolean;
}

// AFTER:
export interface RankedListResult {
  ...
  // isAllTie 제거
}
```

### 테스트 케이스 변경 명세

#### `rankSlots.test.ts`

| 테스트명                                         | 변경 내용                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `공동 2위 2개 - 다음 슬롯은 4위 (3위 스킵)`      | 테스트명 변경: "공동 2위 2개 - 다음 그룹은 3위(밀집 순위)"; d.rank: `4` → `3`               |
| `전원 동률 7슬롯 - 임박한 5장만 visible, rank=1` | 테스트명 변경: "전원 동률 7슬롯 - 전체 visible, 모두 rank=1"; 7개 전부 visible=true, rank=1 |
| `모든 슬롯 0표 - 전부 rank=null, visible=true`   | visible=true 유지 (rankSlots는 0표 슬롯 그대로 반환)                                        |
| `0표 슬롯 섞인 케이스`                           | 변경 없음 (rankSlots는 0표 슬롯 visible=true로 반환, 필터는 toRankedSlots)                  |
| `동률 그룹 내 임박한 미래 날짜`                  | 변경 없음 (모두 rank=1, dense ranking 영향 없음)                                            |
| `5장 정확히 동률`                                | 변경 없음 (모두 rank=1, 이미 통과)                                                          |

#### `toRankedSlots.test.ts`

| 테스트명                                          | 변경 내용                                                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `전원 동률 7슬롯 - isAllTie=true, slots.length=5` | 테스트명 변경: "전원 동률 7슬롯 - 전체 노출"; `slots.length`: 5 → 7; `isAllTie` 검증 제거; 7개 날짜 모두 포함 확인 |
| `badgeGroup 매핑 - 1→rank1, ...null→none`         | `slots.length`: 6 → 5; 0표 슬롯(index 5) 관련 기대값 제거                                                          |
| 나머지 테스트                                     | `isAllTie` 관련 검증이 있으면 제거                                                                                 |

### 영향 범위 분석

| 호출 경로                                          | 영향                           | 대응        |
| -------------------------------------------------- | ------------------------------ | ----------- |
| `MeetResultTablePage` → `toRankedSlots`            | 0표 카드 미표시, 뱃지 정상화   | 의도된 변경 |
| `VoteRankCardsPage`(@deprecated) → `toRankedSlots` | 동일                           | 의도된 변경 |
| `types.ts`의 `isAllTie` 제거                       | `toRankedSlots.test.ts`만 참조 | 테스트 수정 |

---

## Project Structure

### Documentation (this feature)

```text
specs/fix/075-vote-rank-logic-fix/
├── plan.md              # This file
├── spec.md              # Feature specification
└── checklists/
    └── requirements.md
```

### Source Code (변경 파일만)

```text
src/features/vote-rank-cards/
└── lib/
    ├── rankSlots.ts          # dense ranking 전환 + truncation 제거
    ├── rankSlots.test.ts     # 기대값 갱신
    ├── toRankedSlots.ts      # 0표 필터링 + isAllTie 제거
    ├── toRankedSlots.test.ts # 기대값 갱신
    └── types.ts              # RankedListResult isAllTie 제거
```

---

## Architecture Decision Table

| 결정          | 검토 옵션                          | 선택          | 이유                                                            |
| ------------- | ---------------------------------- | ------------- | --------------------------------------------------------------- |
| 순위 방식     | competition ranking, dense ranking | dense ranking | 1위 그룹이 N개여도 다음 그룹은 2위가 되어야 함 (요구사항)       |
| 0표 필터 위치 | rankSlots, toRankedSlots           | toRankedSlots | rankSlots는 순위 계산 전용; 표시 여부 결정은 toRankedSlots 책임 |
| isAllTie 처리 | 유지(의미 변경), 제거              | 제거          | UI에서 미참조, truncation 폐지로 의미 소멸                      |
| UI 변경 여부  | VoteRankCard 수정, 변경 없음       | 변경 없음     | badgeGroup은 slot.rank에서 파생 → lib 수정만으로 자동 해결      |
