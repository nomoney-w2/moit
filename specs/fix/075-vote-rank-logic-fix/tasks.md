# Tasks: VoteRankCardList 순위 뱃지 로직 버그 수정

**Input**: `specs/fix/075-vote-rank-logic-fix/plan.md`, `spec.md`  
**Branch**: `fix/#75-vote-rank-logic-fix`  
**GitHub Issue**: #75

**Format**: `[ID] [P?] [Story?] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 해당 유저 스토리 (US1/US2/US3)

---

## 변경 파일 요약 (총 5개)

```text
src/features/vote-rank-cards/lib/
├── types.ts              ← Foundational (isAllTie 제거)
├── rankSlots.ts          ← US1 (dense ranking) + US2 (truncation 제거)
├── rankSlots.test.ts     ← US1 + US2 테스트 갱신
├── toRankedSlots.ts      ← Foundational + US3 (0표 필터링)
└── toRankedSlots.test.ts ← US3 테스트 갱신
```

---

## Phase 1: Foundational — 타입 시스템 정리

**Purpose**: `isAllTie` 제거 및 `toRankedSlots.ts` 반환 코드 정리. 모든 유저 스토리의 기반이 됨.

**⚠️ CRITICAL**: 이 Phase가 완료되어야 US1/US2/US3 구현이 가능

- [x] T001 `src/features/vote-rank-cards/lib/types.ts`에서 `RankedListResult` 인터페이스의 `isAllTie: boolean` 필드 제거
- [x] T002 `src/features/vote-rank-cards/lib/toRankedSlots.ts`에서 `isAllTie` 계산 코드(`const isAllTie = ...`) 및 반환 객체의 `isAllTie` 프로퍼티 두 곳 제거 (T001 완료 후 동일 파일)

**Checkpoint**: 타입 에러 없이 빌드 통과 확인 (`npx tsc --noEmit`)

---

## Phase 2: User Story 1 — 동률 그룹 뱃지 정상 표시 (Priority: P1) 🎯 MVP

**Goal**: 1위 동률 슬롯이 N개여도 2번째 득표 그룹이 2위 뱃지를 받도록 dense ranking 구현

**Independent Test**:

```bash
npm test -- rankSlots
# "공동 2위 2개" 테스트에서 d.rank === 3 (기존 4 → 3)
```

### Implementation

- [x] T003 [US1] `src/features/vote-rank-cards/lib/rankSlots.ts` — dense ranking 전환:
  - `MAX_VISIBLE_ON_FULL_TIE` 상수 제거
  - `positiveResult` 구성 루프 직전에 `let denseRank = 0;` 선언
  - 루프 내 `const groupRank = cursor + 1;` → `denseRank += 1; const groupRank = denseRank;` 로 변경
  - 0표 슬롯(`zeroSlots`) 처리 코드는 변경 없이 유지

- [x] T004 [US1] `src/features/vote-rank-cards/lib/rankSlots.test.ts` — dense ranking 기대값 수정 (T003 완료 후):
  - 테스트명 `'공동 2위 2개 - 다음 슬롯은 4위 (3위 스킵)'` → `'공동 2위 2개 - 다음 그룹은 3위 (밀집 순위)'` 로 변경
  - `expect(result.find((r) => r.id === 'd')?.rank).toBe(4)` → `.toBe(3)` 으로 변경

**Checkpoint**: `npm test -- rankSlots` 실행 후 T003/T004 관련 케이스 통과

---

## Phase 3: User Story 2 — 전체 슬롯 노출 (Priority: P1)

**Goal**: 전원 동률일 때 5개 truncation을 제거하고 모든 슬롯 노출

**Independent Test**:

```bash
npm test -- rankSlots
# "전원 동률 7슬롯" 테스트에서 result 길이 === 7, 전부 visible=true, rank=1
```

### Implementation

- [x] T005 [US2] `src/features/vote-rank-cards/lib/rankSlots.ts` — truncation 블록 제거 (T003 완료 후 동일 파일):
  - 상수 `MAX_VISIBLE_ON_FULL_TIE = 5` 제거 (T003에서 이미 제거됐다면 확인만)
  - `isAllTie` 분기 블록 전체 제거:
    ```typescript
    // 아래 블록 전체 삭제 (lines 53-73 영역)
    const uniqueCounts = Array.from(new Set(...));
    const isAllTie = ...;
    if (isAllTie && ...) { ... }
    ```
  - 제거 후 `positiveResult` 구성 루프가 곧바로 실행되도록 확인

- [x] T006 [US2] `src/features/vote-rank-cards/lib/rankSlots.test.ts` — truncation 제거 기대값 갱신 (T004 완료 후 동일 파일):
  - 테스트명 `'전원 동률 7슬롯 - 임박한 5장만 visible, rank=1'` → `'전원 동률 7슬롯 - 전체 visible, 모두 rank=1'` 로 변경
  - 기존: `visibleIds` = `['a','b','c','d','e']` (5개), `['f','g']` invisible
  - 변경: `result.every((r) => r.visible)` === `true` (7개 전부 visible)
  - 변경: `result.every((r) => r.rank === 1)` === `true` (7개 전부 rank=1)
  - invisible ID 검증 코드 제거

**Checkpoint**: `npm test -- rankSlots` 전체 통과

---

## Phase 4: User Story 3 — 0표 카드 미표시 (Priority: P2)

**Goal**: `toRankedSlots`가 canCount=0인 슬롯을 결과 배열에서 제외

**Independent Test**:

```bash
npm test -- toRankedSlots
# "badgeGroup 매핑" 테스트: slots.length === 5 (기존 6)
# "전원 동률 7슬롯" 테스트: slots.length === 7 (기존 5)
```

### Implementation

- [x] T007 [US3] `src/features/vote-rank-cards/lib/toRankedSlots.ts` — 0표 슬롯 필터링 추가 (T002 완료 후 동일 파일):
  - `orderedSlots` 구성 루프에서 `entry.canCount === 0` 슬롯 skip:
    ```typescript
    for (const meta of ranked) {
      if (!meta.visible) continue;
      const entry = slotMap.get(meta.id);
      if (!entry) continue;
      if (entry.canCount === 0) continue;  // 추가: 0표 슬롯 제외
      orderedSlots.push({ ... });
    }
    ```

- [x] T008 [US3] `src/features/vote-rank-cards/lib/toRankedSlots.test.ts` — 기대값 갱신 (T007 완료 후):
  - 테스트 `'전원 동률 7슬롯 - isAllTie=true, slots.length=5'`:
    - 테스트명 → `'전원 동률 7슬롯 - 전체 노출, slots.length=7'`
    - `expect(result.isAllTie).toBe(true)` 라인 제거 (isAllTie 필드 제거됨)
    - `expect(result.slots).toHaveLength(5)` → `toHaveLength(7)`
    - `expect(result.slots.map((s) => s.date)).toEqual(dates.slice(0, 5))` → `.toEqual(dates)` (전체 7개)
  - 테스트 `'badgeGroup 매핑 - 1→rank1, 2·3→rank2-3, 4·5→rank4-5, null→none'`:
    - `expect(result.slots).toHaveLength(6)` → `toHaveLength(5)` (0표 슬롯 제외)
    - `slots[5]` (0표 슬롯) 관련 기대값 3개 라인 제거:
      ```typescript
      // 삭제:
      expect(result.slots[5].badgeGroup).toBe('none');
      expect(result.slots[5].rank).toBeNull();
      expect(result.slots[5].canCount).toBe(0);
      ```

**Checkpoint**: `npm test -- toRankedSlots` 전체 통과

---

## Phase 5: Polish & 검증

**Purpose**: 전체 테스트 통과 및 타입 안전성 확인

- [x] T009 [P] 전체 단위 테스트 실행 (`npm test`) — 모든 케이스 통과 확인
- [x] T010 [P] TypeScript 타입 체크 (`npx tsc --noEmit`) — 에러 없음 확인

**Checkpoint**: 모든 테스트 통과, 타입 에러 없음 → PR 준비 완료

---

## Dependencies & Execution Order

### Phase 의존성

```
Phase 1 (Foundational)
    ↓
Phase 2 (US1) ─────────┐
    ↓                   │ (동일 파일: rankSlots.ts, rankSlots.test.ts)
Phase 3 (US2) ─────────┘
    │
    └─ Phase 4 (US3) [독립 파일: toRankedSlots.ts]
         ↓
    Phase 5 (Polish)
```

### 태스크 의존성 (세부)

| 태스크 | 의존       | 이유                                                            |
| ------ | ---------- | --------------------------------------------------------------- |
| T001   | 없음       | 시작점                                                          |
| T002   | T001       | types.ts가 먼저 수정되어야 isAllTie 반환 제거 시 타입 오류 없음 |
| T003   | T001       | rankSlots.ts는 types.ts와 독립 (의존 없으나 T001 후 진행 권장)  |
| T004   | T003       | 동일 파일                                                       |
| T005   | T003       | 동일 파일 (dense ranking 후 truncation 블록 제거)               |
| T006   | T004, T005 | 동일 파일 (T005 적용 후 기대값 갱신)                            |
| T007   | T002       | 동일 파일 (isAllTie 제거 후 필터링 추가)                        |
| T008   | T007       | 동일 파일                                                       |
| T009   | T006, T008 | 모든 구현 완료 후 전체 테스트                                   |
| T010   | T001       | 타입 변경 반영 후 체크                                          |

### 병렬 실행 가능 조합

```bash
# Phase 2+3 순차 완료 후, Phase 4는 독립 실행 가능:
# (단, rankSlots.ts 작업 중에는 toRankedSlots.ts 작업 가능)
[T003 → T004 → T005 → T006]  # rankSlots 시리즈
[T007 → T008]                  # toRankedSlots 시리즈 (T002 이후)

# Phase 5: T009, T010 병렬 실행 가능
[T009, T010]
```

---

## Implementation Strategy

### MVP (US1 Only)

1. Phase 1: T001, T002 완료
2. Phase 2: T003, T004 완료
3. **검증**: `npm test -- rankSlots` — 동률 뱃지 정상 확인
4. US2, US3 추가 후 전체 테스트

### 권장 실행 순서 (단일 개발자)

```
T001 → T002 → T003 → T005 → T004 → T006 → T007 → T008 → T009 → T010
```

> T003과 T005를 순서대로 `rankSlots.ts`에 적용하고, 그 후 테스트 파일을 한꺼번에 갱신하는 방식이 충돌 없이 안전함.

---

## Notes

- 신규 파일 생성 없음 — 기존 5개 파일만 수정
- UI 컴포넌트 (`VoteRankCard`, `VoteRankCardList`) 변경 없음
- `badgeGroup` 매핑 함수 (`mapBadgeGroup`) 변경 없음 — rank 값이 바뀌면 자동 반영
- `MeetResultTablePage`, `VoteRankCardsPage` 변경 없음 — `toRankedSlots` 인터페이스 유지
