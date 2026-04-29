---
description: 'Task list for vote-rank-cards feature implementation'
---

# Tasks: 투표 결과 순위 뱃지 & 아코디언 카드 리스트뷰

**Input**: Design documents from `/specs/feat/068-vote-rank-cards/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/README.md ✅

**Tests**: 단위 테스트(Vitest)는 plan에서 명시적으로 요청됨 — `lib/rankSlots.ts`, `lib/toRankedSlots.ts`에 한정. Storybook stories도 시각 회귀로 포함. Playwright e2e는 본 범위 제외.

**Organization**: Tasks are grouped by user story (US1 / US2 / US3) per spec.md priorities.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일이고 미완료 의존성이 없어 병렬 실행 가능
- **[Story]**: US1=후보 일정 순위 뱃지, US2=아코디언 펼침, US3=예외 상태 안내
- 모든 경로는 레포 루트 기준 절대 상대경로 (`src/...`)

## Path Conventions

본 레포는 단일 Next.js 앱(`src/`) 구조이며, `apps/{app}/` 모노레포가 아니다. 모든 task는 `src/` 기준 경로를 사용한다.

```
src/app/test/vote-rank-cards/   # 라우팅 엔트리
src/features/vote-rank-cards/   # 기능 슬라이스
  ui/   model/   lib/
src/shared/ui/Badge.tsx         # 기존 파일 수정
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 슬라이스 디렉터리 구조 준비 및 외부 자산 사전 점검.

- [x] T001 Verify Vitest config and shared lib/utils availability — confirm `vitest.config.ts`, `src/shared/lib/utils.ts(cn)`, `src/shared/lib/date.ts(formatDate, parseDate)`, `src/shared/hooks/useDisclosure.ts` 모두 존재 여부 확인 (없으면 STOP하고 보고).
- [x] T002 Create feature slice directory tree at `src/features/vote-rank-cards/` with subdirs `ui/`, `model/`, `lib/` (빈 디렉터리 또는 `.gitkeep`).
- [x] T003 Create test page directory `src/app/test/vote-rank-cards/` (빈 디렉터리; page.tsx는 후속 task).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 의존하는 ViewModel 타입·순위 산정 알고리즘·어댑터를 먼저 구축. 본 phase 완료 전에는 어떤 UI 작업도 시작하지 않는다.

⚠️ **CRITICAL**: T004~T010 완료 전 Phase 3+ 시작 금지.

- [x] T004 [P] Define ViewModel types (`MeetingVoteSnapshot`, `ParticipantVote`, `MeetingTimeRange`, `RankBadgeGroup`, `RankedSlot`, `RankedListResult`, `TimeSlotKey`, `TimeSlotId`, `IsoDate`, `Time`, `MeetingStatus`) in `src/features/vote-rank-cards/lib/types.ts` per `data-model.md` §1·§2·§3. No barrel exports; named exports only.
- [x] T005 [P] Implement pure rank algorithm `rankSlots(slotCounts, today): Array<{id, rank, visible}>` in `src/features/vote-rank-cards/lib/rankSlots.ts`. 규칙: 0표 슬롯은 항상 `rank=null, visible=true`(리스트 하단), 1표 이상 슬롯은 canCount desc → 임박한 미래 날짜 asc → 같은 날짜 내 slotIndex asc 정렬, 동률 그룹 단위 순위 부여(다음 순위 = 그룹 끝 + 1), rank≥6은 null, 전원 동률(unique count 1개)+슬롯>5는 임박한 5장만 visible=true. 순수 함수, no React import.
- [x] T006 [P] Write Vitest unit tests for `rankSlots` in `src/features/vote-rank-cards/lib/rankSlots.test.ts` covering: (a) 일반 6슬롯 순서대로 1~5 + null, (b) 공동 2위 2개 → 다음 4위, (c) 모든 슬롯 0표 → 전부 rank=null, (d) 전원 동률 7장 → 임박 5장만 visible, (e) 0표 슬롯 섞인 케이스 → 1표 이상이 먼저 정렬되고 0표가 뒤에 visible=true·rank=null, (f) 같은 날짜 내 이른 시간 우선 보조 정렬. (T005 완료 후 진행 — 단, 같은 파일이 아니므로 P 가능; 의존은 export 시그니처만)
- [x] T007 [Foundational] Implement adapter `toRankedSlots(snapshot, options?): RankedListResult` in `src/features/vote-rank-cards/lib/toRankedSlots.ts` per `data-model.md` §4. 책임: hasVoted=true 필터, dates×slotCount 격자 순회, 각 슬롯 can/cannot 분류, slot id=`${date}#${slotIndex}` 생성, 시각 포맷(`startTime`/`endTime`은 timeRange + slotIndex로 산정), `rankSlots` 호출 후 결과 적용, badgeGroup 매핑(1→rank1, 2·3→rank2-3, 4·5→rank4-5, null→none), `isEmpty`(totalVoters===0), `isAllTie`(unique can-counts === 1) 계산. 의존: T005.
- [x] T008 [Foundational] Write Vitest unit tests for `toRankedSlots` in `src/features/vote-rank-cards/lib/toRankedSlots.test.ts` covering: (a) Figma 시안 9명 시나리오 → 1위/2위/3위/4위/5위 뱃지 + 6위 이하 무뱃지, (b) 빈 입력(participants=[]) → isEmpty=true·slots=[], (c) 모든 hasVoted=false → isEmpty=true, (d) 전원 동률 7슬롯 → isAllTie=true·slots.length=5, (e) badgeGroup 매핑 정확성, (f) 슬롯 시작·종료 시간 계산(예: timeRange 12:00–13:00, slotCount=2 → slot0 12:00–12:30, slot1 12:30–13:00). 의존: T007.
- [x] T009 [P] [Foundational] Modify `src/shared/ui/Badge.tsx` — variant 정비/추가: `rank1`(가장 강조 색·border+bg+text 톤 1), `rank2-3`(공통 색 톤 2), `rank4-5`(공통 색 톤 3). 기존 `rank1/rank2/rank3` variant는 `rank2-3`로 통합되거나 deprecated 표시(다른 사용처 없음을 grep으로 확인 후 정리). 색상은 임시 디자인 토큰 매핑(`primary-default`, `primary-subtle`, `gray-400` 등 가까운 토큰)으로 두고, 정확 헥스코드는 plan 종료 후 Figma 노드(3650-30335 / 3627-6468)에서 추출 시 본 파일만 수정.
- [x] T010 [P] [Foundational] Create mock fixture `src/features/vote-rank-cards/lib/mock.ts` exporting `mockMeetingVoteSnapshot` (Figma 시안 그대로: 9명, hostName='김야뿌', title='두쫀쿠 투어', 1위 7명/0표 1슬롯/공동 2위 2슬롯 등 다양한 케이스 포함), `mockEmptyMeetingVoteSnapshot`(participants=[], maxParticipantCount=9), `mockAllTieMeetingVoteSnapshot`(7개 슬롯 모두 같은 canCount=3). 모두 `MeetingVoteSnapshot` 타입을 만족.

**Checkpoint**: T004~T010 완료 + Vitest 그린 → User Story 구현 시작 가능.

---

## Phase 3: User Story 1 — 후보 일정 순위 뱃지 (Priority: P1) 🎯 MVP

**Goal**: 카드 리스트가 가능한 인원 수 내림차순으로 정렬되고 1~5위에 색상 그룹별 뱃지가 표시된다. 카드는 모두 접힌 상태(헤더만 노출).

**Independent Test**: `/test/vote-rank-cards`에 진입했을 때 Figma 시안 mock 기준 1위에 단독 강조 뱃지, 2~3위 동일 색, 4~5위 동일 색, 6위 이하 무뱃지로 정렬·노출되는지 시각 확인.

### Implementation for User Story 1

- [x] T011 [P] [US1] Implement `RankBadge` lookup helper in `src/features/vote-rank-cards/ui/VoteRankCard.tsx` (또는 인라인) — `RankedSlot.badgeGroup` + `rank`을 `Badge` 컴포넌트의 `variant`로 매핑하는 작은 함수 또는 직접 conditional. 별도 파일 생성하지 않고 카드 내부에 둔다.
- [x] T012 [P] [US1] Create `VoteRankCard.tsx` in `src/features/vote-rank-cards/ui/VoteRankCard.tsx` — props: `{ slot: RankedSlot; isOpen: boolean; onToggle: (id: TimeSlotId) => void }`. 본 task에서는 헤더(요일 포함 날짜, `HH:mm - HH:mm`, rank≥1이면 Badge 노출, "N명이 가능해요" 요약, 펼침 chevron 아이콘)만 우선 구현. 본문은 빈 영역(`isOpen` 분기 placeholder). `'use client'` 명시. function declaration 사용.
- [x] T013 [P] [US1] Create `VoteRankCardList.tsx` in `src/features/vote-rank-cards/ui/VoteRankCardList.tsx` — props: `{ result: RankedListResult }`. `result.slots`을 map하여 `VoteRankCard`를 렌더. 펼침 상태는 페이지 레벨에서 주입되므로 본 컴포넌트도 `openIds: Set<TimeSlotId>` + `onToggle` prop을 받아 `VoteRankCard`에 전달. function declaration. 의존: T012.
- [x] T014 [US1] Create `VoteRankCardsPage.tsx` in `src/features/vote-rank-cards/ui/VoteRankCardsPage.tsx` — props: `{ snapshot: MeetingVoteSnapshot }`. 책임: `toRankedSlots(snapshot)` 호출 → 헤더(모임 제목, "N명이 투표했어요" via `result.totalVoters`, hostName) → US3 빈 상태 분기는 placeholder(다음 phase 처리) → `<VoteRankCardList />` 렌더. 펼침 상태는 임시로 빈 Set 전달(US2에서 훅으로 교체). 페이지 하단에 "투표하기 / 투표 수정하기" CTA placeholder div(시각 영역만, 동작 X). 의존: T007, T013.
- [x] T015 [US1] Create test route `src/app/test/vote-rank-cards/page.tsx` — server component (또는 'use client' 불필요한 thin wrapper)로 `mockMeetingVoteSnapshot` import 후 `<VoteRankCardsPage snapshot={mockMeetingVoteSnapshot} />` 렌더. 의존: T010, T014.
- [x] T016 [P] [US1] Create `VoteRankCard.stories.tsx` in `src/features/vote-rank-cards/ui/VoteRankCard.stories.tsx` — Storybook stories: `Rank1`, `Rank2`, `Rank3`, `Rank4`, `Rank5`, `NoRank`(rank=null, can≥1), `ZeroVote`(rank=null, can=0). 각 story는 isOpen=false 상태로 렌더. 의존: T012.
- [x] T017 [P] [US1] Create `VoteRankCardsPage.stories.tsx` — Storybook stories: `Default`(mockMeetingVoteSnapshot 사용), `LessThanFiveSlots`(슬롯 ≤5인 별도 fixture를 stories 내부에 정의). 의존: T014.

**Checkpoint**: `/test/vote-rank-cards` 진입 시 Figma 시안과 시각적으로 일치(뱃지 색·정렬). Storybook에서 모든 rank state 시각 검증 완료. US2/US3 시작 가능.

---

## Phase 4: User Story 2 — 카드 펼쳐 참여자 목록 확인 (Priority: P1)

**Goal**: 카드 헤더 탭 시 본문이 펼쳐져 가능/불가 참여자 이름이 노출되고, 다시 탭하면 접힘. 다중 펼침 지원, 초기 상태는 모두 접힘.

**Independent Test**: 어떤 카드든 클릭하면 "N명이 가능해요" + 이름 목록 + "M명이 못와요" + 이름 목록이 노출되고, 다시 클릭하면 접힘. 두 카드를 연속으로 펼쳐도 둘 다 펼친 상태로 유지.

### Implementation for User Story 2

- [x] T018 [US2] Implement `useVoteRankCardToggle()` hook in `src/features/vote-rank-cards/model/useVoteRankCardToggle.ts` — 내부 state: `Set<TimeSlotId>`. 반환: `{ openIds: Set<TimeSlotId>; isOpen: (id: TimeSlotId) => boolean; toggle: (id: TimeSlotId) => void }`. function declaration, `'use client'` 명시. 의존: T004.
- [x] T019 [US2] Update `VoteRankCard.tsx` (T012 산출물) — 헤더를 `<button type="button" onClick={() => onToggle(slot.id)} aria-expanded={isOpen} aria-controls={...}>`로 감싸고, `isOpen`일 때 본문 영역에 (a) `"{canCount}명이 가능해요"` 헤더(텍스트 톤 강조) → 가능 참여자 이름 칩/리스트, (b) `"{cannotCount}명이 못와요"` 헤더 → 불가 참여자 이름 리스트 순서대로 렌더. 이름 리스트는 줄바꿈 가능한 flex-wrap 스타일. chevron 아이콘은 `isOpen`에 따라 회전(rotate-180). 의존: T012.
- [x] T020 [US2] Update `VoteRankCardsPage.tsx` (T014 산출물) — `useVoteRankCardToggle()`를 호출하여 `openIds`/`toggle`을 `<VoteRankCardList />`에 전달. `'use client'` 추가. 의존: T013, T018.
- [x] T021 [P] [US2] Add Storybook stories `VoteRankCard.Open` (`isOpen=true`, 본문 노출 상태)와 `VoteRankCard.OpenManyParticipants`(가능 8명/불가 0명) in `src/features/vote-rank-cards/ui/VoteRankCard.stories.tsx`. 의존: T019.

**Checkpoint**: test 페이지에서 카드 클릭 → 펼침/접힘 동작. 두 카드 동시에 펼쳐도 독립 유지. Storybook open stories 시각 검증.

---

## Phase 5: User Story 3 — 예외 상태 안내 (Priority: P2)

**Goal**: 빈 상태 / 전원 동률 / 5슬롯 이하 케이스가 의도된 화면을 노출.

**Independent Test**: 빈 mock·전원 동률 mock·5슬롯 이하 mock 각각에 대해 안내 문구·5장 자르기·전 카드 뱃지 부여가 정상 동작.

### Implementation for User Story 3

- [x] T022 [US3] Create `VoteRankCardEmptyState.tsx` in `src/features/vote-rank-cards/ui/VoteRankCardEmptyState.tsx` — 단순 텍스트 안내 컴포넌트. 문구 예: "아직 투표한 사람이 없어요". 의존: 없음.
- [x] T023 [US3] Update `VoteRankCardsPage.tsx` (T014/T020 산출물) — `result.isEmpty === true`이면 `<VoteRankCardList />` 대신 `<VoteRankCardEmptyState />`만 렌더. 헤더의 "N명이 투표했어요"는 0명일 때도 "0명이 투표했어요"로 일관 노출. 의존: T020, T022.
- [x] T024 [P] [US3] Add Storybook stories in `src/features/vote-rank-cards/ui/VoteRankCardsPage.stories.tsx`: `Empty`(`mockEmptyMeetingVoteSnapshot`), `AllTie`(`mockAllTieMeetingVoteSnapshot` — 5장만 노출 검증), `LessThanFiveSlots`(이미 T017에서 추가됐다면 강화). 의존: T010, T023.
- [~] T025 [US3] Manual verify on test page — 임시로 `src/app/test/vote-rank-cards/page.tsx`에서 fixture를 셋 중 하나로 교체하며(또는 query param으로 분기) 세 가지 mock의 화면을 확인. 검증 후 page.tsx는 기본 fixture로 복구. 의존: T024.

**Checkpoint**: 세 가지 예외 케이스 모두 의도된 화면. Storybook 시각 회귀 통과.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 마무리 검증 및 잠재 회귀 차단.

- [x] T026 [P] Run `npm test` (Vitest) and confirm `rankSlots.test.ts`·`toRankedSlots.test.ts` 모두 그린.
- [x] T027 [P] Run `npm run lint` and fix any reported issues in `src/features/vote-rank-cards/**` and `src/shared/ui/Badge.tsx`.
- [x] T028 [P] Run `tsc --noEmit` (또는 `npm run typecheck` 존재 시) and resolve type errors.
- [~] T029 Run Storybook (`npm run storybook`) and visually verify all new stories(`VoteRankCard.*`, `VoteRankCardsPage.*`) render without console errors.
- [~] T030 Manual browser test — `npm run dev` → http://localhost:3000/test/vote-rank-cards 에서 (a) 정렬·뱃지 그룹 색상, (b) 카드 토글, (c) 빈/전원동률 fixture 교체 시 화면을 확인하고 결과를 PR description에 기록.
- [x] T031 Update `CLAUDE.md` Recent Changes section if not already added by `update-agent-context.sh` — feat/#68-vote-rank-cards 항목.
- [x] T032 Verify Constitution compliance one more time: no barrel exports (`grep -r "from '@/features/vote-rank-cards'$"` 결과 없음 확인), function declarations only (`grep -r "const.*= () =>"` 컴포넌트 파일 없음 확인), unidirectional deps (`features/vote-rank-cards`가 `app/` import 안 함, `shared`가 features import 안 함 확인).

---

## Dependencies & Execution Order

### Phase Dependencies

```
Setup (Phase 1) ──▶ Foundational (Phase 2) ──▶ US1 (Phase 3) ──▶ US2 (Phase 4) ──▶ US3 (Phase 5) ──▶ Polish (Phase 6)
                                            └──▶ US3 (Phase 5)  (Phase 4와 병렬 가능)
```

- **Phase 1 (Setup)**: 즉시 시작 가능 (T001 → T002 → T003).
- **Phase 2 (Foundational)**: Phase 1 완료 후. T004(types) → T005(rankSlots) ↔ T006(rankSlots.test) → T007(toRankedSlots) → T008(toRankedSlots.test). T009(Badge), T010(mock)는 T004 이후 병렬.
- **Phase 3 (US1, MVP)**: Phase 2 완료 후 시작. T012/T013/T016 병렬 가능, T014는 T013·T007 의존, T015는 T014·T010 의존.
- **Phase 4 (US2)**: Phase 3 완료 후. T018·T019·T020·T021 순서.
- **Phase 5 (US3)**: Phase 3 이후 병렬 시작 가능(Phase 4와 무관). T022 → T023 → T024 → T025.
- **Phase 6 (Polish)**: 모든 US 완료 후.

### User Story Dependencies

- **US1 (P1)**: Foundational만 의존. 단독 배포 가능 → MVP.
- **US2 (P1)**: US1 산출물(`VoteRankCard`, `VoteRankCardsPage`)에 본문 토글을 덧붙이는 형태이므로 US1 완료 후 시작 권장(파일 충돌 방지). 단, 동일 작업자라면 US1+US2를 한 번에 묶어 PR도 가능.
- **US3 (P2)**: Foundational + US1만 있으면 시작 가능. US2와 병렬 가능.

### Within Each User Story

- 모델/타입(Phase 2 T004) → 산정 알고리즘(T005) → 어댑터(T007) → UI 카드(T012) → 리스트(T013) → 페이지(T014) → 라우트(T015).
- Stories/테스트는 해당 컴포넌트 구현 직후.

### Parallel Opportunities

- **Setup**: T002·T003 동시 가능(다른 디렉터리).
- **Phase 2 [P]**: T004 완료 후 T005·T009·T010 동시 가능(서로 다른 파일). T006은 T005 import에만 의존.
- **US1 [P]**: T012·T013·T016 동시(별도 파일). T014는 T013 후, T015는 T014 후.
- **US3 [P]**: T024는 T023 후 단독, 나머지 순차.
- **Polish [P]**: T026·T027·T028 동시.

---

## Parallel Example: Phase 2 Foundational

```bash
# T004 완료 후 동시 실행 가능:
Task: "Implement rankSlots in src/features/vote-rank-cards/lib/rankSlots.ts"          # T005
Task: "Modify src/shared/ui/Badge.tsx variants (rank1, rank2-3, rank4-5)"             # T009
Task: "Create mock fixture in src/features/vote-rank-cards/lib/mock.ts"               # T010
```

## Parallel Example: User Story 1

```bash
# Phase 2 종료 후 US1 내부에서 동시 실행 가능:
Task: "Create VoteRankCard.tsx in src/features/vote-rank-cards/ui/VoteRankCard.tsx"            # T012
Task: "Create VoteRankCardList.tsx in src/features/vote-rank-cards/ui/VoteRankCardList.tsx"    # T013
Task: "Create VoteRankCard.stories.tsx in src/features/vote-rank-cards/ui/"                    # T016
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational (모든 알고리즘+어댑터+테스트 그린) → 3. Phase 3 US1.
2. **STOP & VALIDATE**: `/test/vote-rank-cards` 진입해 정렬·뱃지 색상 확인 → 데모 가능.

### Incremental Delivery

1. MVP (US1) 완료 → 시각 회귀 PR.
2. US2(아코디언) 추가 → 인터랙션 PR.
3. US3(예외 상태) 추가 → 마무리 PR.
4. Polish phase로 정합성 확인.

### Solo Strategy (현재 권장)

본 기능은 단일 슬라이스 + 작은 면적. 1인 작업 시 Phase 1~6을 순차로 진행하되, Phase 2의 [P] 작업은 한 세션에서 묶어 처리해 컨텍스트 비용 절감.

---

## Notes

- [P] 표시는 "다른 파일 + 미완료 의존성 없음" 두 조건을 모두 만족할 때만.
- Storybook story 추가 시에도 `'use client'` 누락 주의(컴포넌트 자체는 client).
- 색상 토큰은 임시 매핑이며, plan 종료 후 Figma 노드 추출로 한 번 더 다듬을 예정 — 본 단계에서는 그룹 분리만 명확히 하면 충분.
- 본 기능 컴포넌트는 어떤 외부 store(react-query/zustand)도 사용하지 않는다. 페이지 단위 `useState`/`Set` 만 사용.
- 배럴 패턴 절대 금지: 각 컴포넌트/유틸은 자기 파일 경로로 직접 import.
