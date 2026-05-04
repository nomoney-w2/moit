# Tasks: 모임 테이블뷰 화면

**Input**: Design documents from `/specs/feat/133-meet-table-view/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Branch**: `feat/#133-meet-table-view`

**Tests**: spec/plan에서 강제 TDD를 요구하지 않음. 핵심 순수 함수 단위 테스트만 Polish 단계에 포함.

**Organization**: 태스크는 5개의 user story(US1~US5)로 그룹화되어 각 스토리 단위로 독립 구현·테스트 가능.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일·미완 의존 없음 — 병렬 가능
- **[Story]**: 해당 user story 매핑(US1~US5)
- 모든 경로는 저장소 루트 기준 절대/상대 경로

## Path Conventions

본 저장소는 단일 Next.js 앱 구조(`src/...`). FSD 레이어:

- `src/app/{route}/page.tsx` — 라우팅 진입(얇게)
- `src/features/{feature}/{ui|model|lib}/` — 행동 단위 기능
- `src/entities/{entity}/{dto|api|lib}/` — 도메인 단위
- `src/widgets/{widget}/ui/` — 섹션 단위 조립 UI(재사용)
- `src/shared/{ui|lib|hooks|api|...}` — 도메인 비의존

---

## Phase 1: Setup

**Purpose**: 본 feature 작업을 위한 사전 환경 확인

- [x] T001 브랜치·이슈 상태 확인: 현재 작업 브랜치가 `feat/#133-meet-table-view`이고 GitHub 이슈 #133이 OPEN 상태인지 확인
- [x] T002 의존성 변경 없음 확인: `package.json`에 추가 패키지 설치 불요(Tailwind 4, ky, zod, date-fns 모두 이미 존재)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 user story의 기반이 되는 entity 스켈레톤·상수·순수 lib. 본 단계 미완 시 어떤 user story도 시작 불가.

- [x] T003 [P] Create `voteTimeSlotStat` zod 스키마와 타입을 [src/entities/voteTimeSlotStat/dto/voteTimeSlotStat.dto.ts](src/entities/voteTimeSlotStat/dto/voteTimeSlotStat.dto.ts) 에 정의(data-model.md `TimeSlotCell`, `VoteTimeSlotStat`)
- [x] T004 [P] Create 결정론적 mock 생성기 `generateMockVoteTimeSlotStat` 를 [src/entities/voteTimeSlotStat/lib/mock.ts](src/entities/voteTimeSlotStat/lib/mock.ts) 에 작성(data-model.md "Mock Data Strategy" 분포 정책). **변경**: 시간 도메인 상수는 FSD 단방향 import 위반 방지를 위해 [src/shared/config/timeSlot.ts](src/shared/config/timeSlot.ts) 로 추출하고 entity·feature 양쪽에서 import.
- [x] T005 [P] Create API 스텁 `fetchVoteTimeSlotStat` 를 [src/entities/voteTimeSlotStat/api/fetchVoteTimeSlotStat.ts](src/entities/voteTimeSlotStat/api/fetchVoteTimeSlotStat.ts) 에 작성(`throw new Error('not implemented yet')`, contracts/fetchVoteTimeSlotStat.contract.md 참조)
- [x] T006 [P] Create 시간 슬롯 도메인 상수를 [src/shared/config/timeSlot.ts](src/shared/config/timeSlot.ts) 에 / 시각화 상수(`OPACITY_LEVELS, OPACITY_CLASS_MAP, BASE_TONE_CLASS`)는 [src/features/meet-result-table/lib/timeSlotConstants.ts](src/features/meet-result-table/lib/timeSlotConstants.ts) 에 정의(data-model.md "Constants" + FSD 준수)
- [x] T007 [P] Create 셀 키 직렬화 `cellKey(date, slotIdx)` / `parseCellKey(key)` 를 [src/features/meet-result-table/lib/slotKey.ts](src/features/meet-result-table/lib/slotKey.ts) 에 작성(data-model.md "Cell Key Format")
- [x] T008 Create 농도 계산 순수 함수 `computeHeatmapIntensity(cells)` 를 [src/features/meet-result-table/lib/computeHeatmapIntensity.ts](src/features/meet-result-table/lib/computeHeatmapIntensity.ts) 에 작성(research.md R-003 정책: 0명 제외, distinct count 내림차순, 5위 동률 무제한, OPACITY_LEVELS 매핑) — T006, T007 의존

**Checkpoint**: Foundation ready — user story 시작 가능

---

## Phase 3: User Story 1 - 시간 슬롯 히트맵으로 가능한 시간대 한눈에 파악 (Priority: P1) 🎯 MVP

**Goal**: `/meet/{meetingId}` 진입 시 후보 날짜 × 9~21시 30분 단위 슬롯 그리드가 가능 인원수 기준 상위 5개 셀에 100/70/50/30/10% 농도로 표시되고, 6위 이하·0명 슬롯은 베이스 톤으로 표시된다. "{N}명이 투표했어요" 카운트가 상단에 노출된다.

**Independent Test**: mock 데이터(예: 9명 참여자, 후보 날짜 7개, distinct 가능 인원수 6종 이상)로 페이지 진입 시 (a) 1위 셀이 가장 진하게 (b) 5위 셀이 가장 연하게 (c) 6위 이하·0명 셀은 베이스 톤 (d) 카운트 = `participants.filter(hasVoted).length` 가 표시되는지 시각·DOM 점검.

### Implementation for User Story 1

- [x] T009 [P] [US1] Create 단일 셀 컴포넌트 `HeatmapCell` 를 [src/features/meet-result-table/ui/HeatmapCell.tsx](src/features/meet-result-table/ui/HeatmapCell.tsx) 에 작성 — props: `{ date, slotIdx, intensity }`. `intensity`(`OpacityLevel | null`)에 따라 `OPACITY_CLASS_MAP[intensity]` 또는 `BASE_TONE_CLASS` 적용. `aria-label="{date} {hh:mm}: 가능한 사람 {n}명"`(R-004).
- [x] T010 [P] [US1] Create 화면 단위 토글 컴포넌트 `ViewToggle` 를 [src/features/meet-result-table/ui/ViewToggle.tsx](src/features/meet-result-table/ui/ViewToggle.tsx) 에 작성 — `role="switch"`, `aria-checked` 동기, 격자/캘린더 인라인 SVG 아이콘 토글
- [x] T011 [P] [US1] Create 카운트 바 `ResultCountBar` 를 [src/features/meet-result-table/ui/ResultCountBar.tsx](src/features/meet-result-table/ui/ResultCountBar.tsx) 에 작성 — `text-primary-default`로 카운트 강조, ViewToggle 우측 배치
- [x] T012 [P] [US1] Create 뷰모드 훅 `useViewMode` 를 [src/features/meet-result-table/model/useViewMode.ts](src/features/meet-result-table/model/useViewMode.ts) 에 작성 — `useState<'table' | 'calendar'>('table')` + `toggle`/`setMode` 반환
- [x] T013 [US1] Create 그리드 본체 `HeatmapGrid` 를 [src/features/meet-result-table/ui/HeatmapGrid.tsx](src/features/meet-result-table/ui/HeatmapGrid.tsx) 에 작성. 내부에서 `computeHeatmapIntensity(cells)` 호출. 좌측 시간 라벨 컬럼 + 상단 날짜 헤더 행(요일+월·일 2단). `role="grid"`. **US2 sticky/overflow 동시 반영**(T017과 통합) — `overflow-auto`, 시간 컬럼 `sticky left-0 z-20`, 날짜 헤더 `sticky top-0 z-10`
- [x] T014 [US1] Create 테이블뷰 본체 `ResultTableView` 를 [src/features/meet-result-table/ui/ResultTableView.tsx](src/features/meet-result-table/ui/ResultTableView.tsx) 에 작성 — `<ResultCountBar>` + `<HeatmapGrid>` 조립
- [x] T015 [US1] Create 페이지 조립 컴포넌트 `MeetResultTablePage` 를 [src/features/meet-result-table/ui/MeetResultTablePage.tsx](src/features/meet-result-table/ui/MeetResultTablePage.tsx) 에 작성 — `'use client'`, `useViewMode` `mode='table'` 분기만 구현(US3에서 calendar 분기 추가)
- [x] T016 [US1] Modify [src/app/meet/[meetingId]/page.tsx](src/app/meet/%5BmeetingId%5D/page.tsx) — `getMeetingById` 유지, `generateMockVoteTimeSlotStat` 추가, `voteCount = filter(hasVoted).length`, `<MeetResultTablePage>` 로 교체. ParticipantHeader/VoteActionButtons 유지

**Checkpoint**: 페이지 진입 → 헤더(기존)+카운트바+히트맵+하단버튼(기존)이 보이고, 농도 5단계가 mock 데이터에서 시각 확인 가능. 토글은 visible but no-op.

---

## Phase 4: User Story 2 - 가로·세로 스크롤로 많은 후보 날짜와 긴 시간 범위 탐색 (Priority: P1)

**Goal**: 후보 날짜가 화면 폭을 초과할 때 가로 스크롤이 동작하고, 9~21시 시간 범위가 화면 높이를 초과할 때 세로 스크롤이 동작한다. 좌측 시간 라벨 컬럼은 가로 스크롤 시 고정, 상단 날짜 헤더 행은 세로 스크롤 시 고정. 첫 진입 시 우측 가장자리에 다음 컬럼이 일부 보여 추가 컬럼 단서를 준다.

**Independent Test**: 후보 날짜 7개·15개·30개 시나리오에서 (a) 좌측 시간 컬럼이 가로 스크롤 시 고정 유지 (b) 상단 날짜 헤더가 세로 스크롤 시 고정 유지 (c) 첫 진입 viewport에 약 4일이 보이고 5번째 컬럼 일부 컷오프 (d) 가로·세로 스크롤이 자유롭게 동시 작동.

### Implementation for User Story 2

- [x] T017 [US2] Modify [src/features/meet-result-table/ui/HeatmapGrid.tsx](src/features/meet-result-table/ui/HeatmapGrid.tsx) — T013 작성 시점에 통합 반영: `overflow-auto`, 시간 컬럼 `sticky left-0 z-20 bg-white`, 날짜 헤더 `sticky top-0 z-10 bg-white`
- [x] T018 [US2] 컬럼 폭 `COL_W=64`로 고정해 mobile viewport(max-w-screen-sm)에서 첫 진입 시 4일이 보이고 5번째 컬럼이 일부 잘려 보이는 효과를 확보. Playwright 검증 통과(`scrollWidth > clientWidth`)

**Checkpoint**: US1 + 스크롤 + 고정 컬럼/헤더 + 우측 컷오프 단서까지 동작.

---

## Phase 5: User Story 3 - 토글로 기존 캘린더뷰 전환 (Priority: P2)

**Goal**: 우상단 토글 클릭 시 동일 모임 데이터를 기존 `VoteResultDataView`(날짜별 가능/불가 카드)로 전환. 다시 클릭 시 테이블뷰 복귀. 페이지 재진입 시 기본은 테이블뷰.

**Independent Test**: 페이지 진입 → 토글 클릭 → DOM에서 `HeatmapGrid` 사라지고 `VoteResultDataView` 영역 표시. 다시 클릭 → 복귀. 새로고침 → 테이블뷰 복귀.

### Implementation for User Story 3

- [x] T019 [US3] Modify [src/features/meet-result-table/ui/MeetResultTablePage.tsx](src/features/meet-result-table/ui/MeetResultTablePage.tsx) — calendar 분기에 `<VoteResultDataView>` 렌더(직접 import). `<ResultCountBar>`는 양쪽 분기 위에 공통 배치
- [x] T020 [US3] Modify [src/features/meet-result-table/ui/ResultCountBar.tsx](src/features/meet-result-table/ui/ResultCountBar.tsx) — ViewToggle 동작 wiring 완료(US1 작성 시 prop 연결됨). E2E `aria-checked` 토글 동작 확인
- [x] T021 [US3] Modify [src/features/meet-result-table/ui/ViewToggle.tsx](src/features/meet-result-table/ui/ViewToggle.tsx) — `<button role="switch">` 기본 동작으로 Enter/Space 활성화. amplitude 트래킹은 spec에서 강제하지 않아 생략(추후 추가 가능)

**Checkpoint**: 토글 동작 완료. 두 뷰가 같은 데이터를 다른 표현으로 보여줌.

---

## Phase 6: User Story 4 - 모임 헤더에서 모임 정보·공유·새 모임 생성 (Priority: P2)

**Goal**: 상단 `ParticipantHeader`(좌상단 캘린더+, 중앙 타이틀, 우상단 공유)가 그대로 동작. 모임 타이틀 = "{hostName}님이 초대한 {title}".

**Independent Test**: (a) 헤더 중앙에 호스트명+타이틀 표시 (b) 좌상단 캘린더+ 탭 → 새 모임 생성 진입(`RegisterSequenceBottomSheet` → /create) (c) 우상단 공유 탭 → `LinkShareBottomSheet` open.

### Implementation for User Story 4

- [x] T022 [US4] Verify [src/app/meet/[meetingId]/page.tsx](src/app/meet/%5BmeetingId%5D/page.tsx) 의 `<ParticipantHeader title={...} url={...} />`가 T016 수정 후에도 그대로 유지됨(line 108-112)

**Checkpoint**: 헤더 동작 변화 없음 확인.

---

## Phase 7: User Story 5 - 하단 투표하기·투표 수정하기 액션 (Priority: P2)

**Goal**: 하단 고정 영역에 "투표 수정하기"(보조)와 "투표하기"(주) 두 버튼이 항상 표시되며 각각 `/meet/{id}/edit`, `/meet/{id}/register` 로 이동.

**Independent Test**: 페이지 진입(투표 여부 무관) → 하단 두 버튼 노출 → 각각 탭 → 의도한 라우트로 이동.

### Implementation for User Story 5

- [x] T023 [US5] Verify [src/app/meet/[meetingId]/page.tsx](src/app/meet/%5BmeetingId%5D/page.tsx) 의 `<VoteActionButtons meetingId={meetingId} />`가 T016 수정 후에도 그대로 유지됨(line 123). VoteActionButtons는 자체적으로 `fixed bottom-0` 적용되어 있어 그리드 스크롤과 무관

**Checkpoint**: 하단 버튼 동작 변화 없음 확인.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 단위/E2E 테스트, Storybook, 시각 QA 등 품질 강화

- [x] T024 [P] Create 단위 테스트 [src/features/meet-result-table/lib/computeHeatmapIntensity.test.ts](src/features/meet-result-table/lib/computeHeatmapIntensity.test.ts) — 6개 시나리오 통과(모두 0명/distinct 1종/distinct 5종/distinct 6종+/5위 동률 다수/1위 동률 다수)
- [x] T025 [P] Create 단위 테스트 [src/features/meet-result-table/lib/slotKey.test.ts](src/features/meet-result-table/lib/slotKey.test.ts) — round-trip + 포맷 2개 시나리오 통과
- [x] T026 [P] Create Storybook 스토리 [src/features/meet-result-table/ui/HeatmapGrid.stories.tsx](src/features/meet-result-table/ui/HeatmapGrid.stories.tsx) — 6개 변형: FullVote(7일·9명), FewDates(1일), FourDates(4일), ManyDates(14일·가로 스크롤), ZeroVotes(전부 0명), AllTied(전부 동률). 시각 검증용 데모 페이지 [src/app/test/meet-table/page.tsx](src/app/test/meet-table/page.tsx) 도 함께 유지
- [x] T027 [P] Create Storybook 스토리 [src/features/meet-result-table/ui/ResultTableView.stories.tsx](src/features/meet-result-table/ui/ResultTableView.stories.tsx) — TableMode + ZeroVotes 2개 변형
- [x] T028 Playwright E2E [e2e/meet-table-view.spec.ts](e2e/meet-table-view.spec.ts) — 4개 시나리오 통과: 헤더/카운트/그리드 렌더, 셀 갯수(7×24=168), 가로 스크롤, 토글 동작. 시각 스냅샷 베이스라인 생성([e2e/meet-table-view.spec.ts-snapshots/](e2e/meet-table-view.spec.ts-snapshots/))
- [x] T029 a11y: ViewToggle `role="switch"` + `aria-checked` 토글 검증(E2E), HeatmapCell/Grid `role="gridcell"` + `aria-label="{date} {hh:mm}: 가능한 사람 {n}명"` 적용 완료
- [x] T030 시각 QA: 데모 페이지 스크린샷이 Figma 3557:9438 디자인과 구조·색·간격 부합 확인(상단 타이틀, 카운트 색 강조, 토글, 5단계 농도, 토요일 빨간색, 우측 컷오프 단서). 후속 미세 디테일 조정은 별도 PR.
- [x] T031 [P] Code review: 배럴 export 0건(`grep -r "export \*" src/features/meet-result-table src/entities/voteTimeSlotStat`), function declaration 적용, FSD 단방향(entity가 feature 의존하던 위반은 T006에서 shared/config로 추출하여 해소), TS 0 error / ESLint 0 error

---

## Dependencies & Story Completion Order

```
Phase 1 (Setup)
  ↓
Phase 2 (Foundational: T003~T008)         [BLOCKS ALL]
  ↓
Phase 3 (US1) ─ MVP ─ Heatmap 표시
  ↓
Phase 4 (US2) ─ Scroll/Sticky 보강  ← US1 위에 적층(같은 HeatmapGrid 파일 수정)
  ↓                                   (US1 단독으로도 데모 가능)
Phase 5 (US3) ─ Toggle 동작        ← US1의 MeetResultTablePage 확장
  ↓
Phase 6 (US4) ─ Header 검증        [Trivial; T016 결과 확인]
Phase 7 (US5) ─ Bottom Btn 검증    [Trivial; T016 결과 확인]
  ↓
Phase 8 (Polish)
```

**Story-level dependency**:

- **US1 → US2**: US2가 US1의 `HeatmapGrid.tsx` 파일을 수정 → 순차
- **US1 → US3**: US3가 US1의 `MeetResultTablePage.tsx` 파일을 수정 → 순차
- **US2 ⊥ US3**: 서로 다른 파일을 수정하므로 **병렬 가능**(같은 dev가 분기 작업하지 않을 때)
- **US4, US5**: T016 완료(US1) 후 단순 검증 → US1 이후 언제든

## Parallel Execution Examples

### Phase 2 — 모든 foundational tasks 병렬

T003, T004, T005, T006, T007 다섯 개를 동시에 5명 또는 5개 에이전트에 분배 가능. T008은 T006, T007 완료 후.

```
[병렬]
- T003 voteTimeSlotStat dto
- T004 voteTimeSlotStat mock
- T005 fetchVoteTimeSlotStat 스텁
- T006 timeSlotConstants
- T007 slotKey
[직렬]
- T008 computeHeatmapIntensity (T006, T007 의존)
```

### Phase 3 — US1 내부 병렬

T009(HeatmapCell), T010(ViewToggle), T011(ResultCountBar; T010 의존), T012(useViewMode) 중:

- T009, T010, T012 는 서로 독립 → **병렬 [P]**
- T011 은 T010 의존 → 순차
- T013(HeatmapGrid)은 T008, T009 의존 → 두 작업 후
- T014(ResultTableView)은 T011, T013 의존
- T015(MeetResultTablePage)은 T012, T014 의존
- T016(page.tsx)은 T004, T015 의존

```
[병렬 가능 starter]
- T009 HeatmapCell
- T010 ViewToggle
- T012 useViewMode
[T010 후]
- T011 ResultCountBar
[T008 + T009 후]
- T013 HeatmapGrid
[T011 + T013 후]
- T014 ResultTableView
[T012 + T014 후]
- T015 MeetResultTablePage
[T004 + T015 후]
- T016 page.tsx
```

### Phase 4–5 — US2 과 US3 동시 진행(서로 다른 파일)

US1 완료 후 US2(HeatmapGrid 수정)와 US3(MeetResultTablePage 수정) 두 개발자가 병렬 분담 가능. 단 하나의 PR로 합치려면 T028(E2E) 작성 시점에 통합.

### Phase 8 — Polish 다중 병렬

T024, T025, T026, T027, T031 모두 다른 파일 → 동시 작업 가능.

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 (Setup) — 분 단위
2. Phase 2 (Foundational) — T003~T008 (5+1)
3. Phase 3 (US1) — T009~T016 (8개)
4. **STOP & VALIDATE**: 페이지 진입 시 정확한 농도의 히트맵, 카운트, 헤더, 하단버튼이 보이는지 시각 확인. 토글은 무동작이지만 시각만 존재
5. Demo 가능 — Figma 메인 화면의 정적 모습 100% 재현

### Incremental Delivery

1. **MVP(US1)**: 데모/리뷰
2. **+ US2**: 스크롤·고정 컬럼 → 더 많은 날짜 시나리오 시연
3. **+ US3**: 토글 → 두 뷰 전환 데모
4. **+ US4, US5**: 사실상 무코딩 검증
5. **+ Polish**: 테스트·Storybook·a11y·QA

### Parallel Team Strategy

- **Dev A**: Foundational(T003~T008) → US1 내부 직렬(T009~T016)
- **Dev B**: 동시에 lib 단위테스트(T024, T025) Polish 병행
- **US1 완료 후**: Dev A → US2(T017, T018), Dev B → US3(T019~T021)
- **US2/US3 완료 후**: 각자 Storybook(T026, T027) 분담
- **마지막**: T028 E2E + T029 a11y + T030 시각 QA

---

## Validation Checklist

태스크 생성이 명세 요구사항을 누락 없이 커버하는지 마지막 점검.

| Spec 항목                                | 커버 태스크      | 비고                                        |
| ---------------------------------------- | ---------------- | ------------------------------------------- |
| FR-001 (기본 진입 = 테이블뷰)            | T012, T015       | useViewMode 기본값 'table'                  |
| FR-002 (가로축 = 후보 날짜, 요일+월일)   | T013             | HeatmapGrid 헤더                            |
| FR-003 (세로축 9~21시 30분, 정시 라벨만) | T013             | timeSlotConstants + 셀 내부 점선            |
| FR-004 (셀 = (date, 30min) 단위)         | T009, T013       | HeatmapCell + cellKey                       |
| FR-005 (5단계 농도)                      | T008, T009       | computeHeatmapIntensity + OPACITY_CLASS_MAP |
| FR-006 (동률 묶음)                       | T008             | research.md R-003 정책                      |
| FR-007 (6위 이하·0명 베이스)             | T008, T009       | null intensity 분기                         |
| FR-008 (30분 슬롯 독립 색상)             | T013             | 정시 셀 내부에 두 개의 HeatmapCell          |
| FR-009 (호스트+모임 타이틀 표시)         | T022             | ParticipantHeader 재사용                    |
| FR-010 (캘린더+ → 새 모임 생성)          | T022             | KEEP 기존 동작                              |
| FR-011 (공유 → 기존 동작)                | T022             | KEEP 기존 동작                              |
| FR-012 ("{N}명 투표" 카운트)             | T011, T016       | ResultCountBar + voteCount 계산             |
| FR-013 (카운트 우측 토글)                | T011             | ResultCountBar 우측 슬롯                    |
| FR-014 (토글 → 캘린더뷰 전환)            | T019, T020, T021 | mode 분기 + VoteResultDataView 재사용       |
| FR-015 (페이지 리로드 아닌 영역 교체)    | T015, T019       | useState 기반 분기                          |
| FR-016 (재진입 기본 테이블뷰)            | T012             | useState 기본값                             |
| FR-017 (가로 스크롤 / 페이지네이션 X)    | T017             | overflow-x-auto                             |
| FR-018 (세로 스크롤)                     | T017             | overflow-y-auto                             |
| FR-019 (시간 라벨 sticky left)           | T017             | sticky left-0                               |
| FR-020 (날짜 헤더 sticky 처리)           | T017             | sticky top-0 within grid                    |
| FR-021 (우측 컷오프 단서)                | T018             | column width 조정                           |
| FR-022 (두 버튼 항상 표시)               | T023             | VoteActionButtons 재사용                    |
| FR-023 (각 라우팅 정확)                  | T023             | KEEP 기존 동작                              |
| FR-024 (그리드 스크롤과 무관 fixed)      | T023             | KEEP 기존 동작                              |
| SC-001 (3초 내 1위 식별)                 | T030             | 시각 QA                                     |
| SC-002 (1초 내 렌더)                     | T028             | E2E 측정                                    |
| SC-003 (60fps 가로 스크롤)               | T030             | 시각 QA                                     |
| SC-004 (200ms 토글 전환)                 | T028             | E2E 측정                                    |
| SC-005 (4가지 데이터 시나리오)           | T026             | Storybook variants                          |
| SC-006 (4종 진입점 1탭 도달)             | T028             | E2E 검증                                    |
| Edge: 0명 슬롯 베이스                    | T008, T024       | computeHeatmapIntensity + 단위테스트        |
| Edge: 컷오프 동률                        | T008, T024       | research.md R-003                           |
| Edge: 후보 날짜 1~2개                    | T026             | Storybook variant                           |
| a11y: ViewToggle role=switch             | T010, T021, T029 | research.md R-004                           |
| a11y: grid role=grid                     | T013, T029       | aria 마크업                                 |

---

## Notes

- **[P] tasks** = 다른 파일·미완 의존 없음. 진정 병렬.
- **[Story] label** = 해당 user story 추적용. setup/foundational/polish는 라벨 없음.
- **태스크당 커밋** 권장 — 각 태스크가 conventional commit 단위.
- **Foundational 미완** 상태에서 user story 시작 금지(T003~T008).
- **No barrel exports**: 모든 import는 개별 파일 직접 (`from '@/widgets/vote-result/ui/VoteResultDataView'`).
- **Function declaration** 컴포넌트 사용(`export default function MeetResultTablePage() {}`).
- **시간 슬롯 데이터 모델 별도 명세**: 본 태스크는 mock 경로만 활성. 실 API 도입 시 T005(`fetchVoteTimeSlotStat`)와 T016(page.tsx 한 줄)만 변경.
