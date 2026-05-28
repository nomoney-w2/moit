# Tasks: 모임 생성·투표 결과 Figma 시안 일치 폴리시

**Input**: Design documents from `/specs/feat/087-meet-figma-sync-fixes/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: 3 hook 각각에 Vitest 단위 테스트(총 3개) — US1 회귀 보호 권장. E2E 신규 케이스는 추가하지 않는다 (research.md R-6).

**Organization**: 작업은 spec.md 의 3개 user story 우선순위(P1 → P2 → P3)에 맞춰 분리된다. 각 story 는 독립적으로 머지 가능한 increment 다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일·의존 없음 → 병렬 실행 가능
- **[Story]**: 어느 user story 에 속하는지 (US1 / US2 / US3)
- 파일 경로는 모두 repo root 기준 절대 표기

## Path Conventions

본 프로젝트는 모노레포가 아닌 **단일 Next.js 앱 (`src/`)** 구조다. 모든 파일 경로는 `/Users/jaemin/Project/moit/src/...` 또는 repo root 상대 경로 `src/...` 를 사용한다.

---

## Phase 1: Setup

**Purpose**: 본 폴리시는 신규 디렉토리·의존성 추가가 없어 별도 setup 작업이 필요하지 않다. 작업 시작 전 브랜치 확인만 한다.

- [x] T001 현재 브랜치가 `feat/#87-meet-figma-sync-fixes` 인지 확인 (`git branch --show-current`). 아니라면 체크아웃.

---

## Phase 2: Foundational

**Purpose**: blocking prerequisite — Figma 토글 아이콘 자산(US3)에 의존하는 다른 작업이 없으므로, 본 폴리시에는 **공통 foundational 작업이 없다**.

(없음 — 각 user story 가 서로 독립적으로 진행 가능.)

**Checkpoint**: 바로 User Story 1 로 진행.

---

## Phase 3: User Story 1 — 이름 성격 입력 3 흐름의 공백 허용 (Priority: P1) 🎯 MVP

**Goal**: 모임장/모임명 + 참여자 이름(등록/수정) 모든 이름 성격 입력에 반각 공백을 허용하고, 공백-only 입력에 대해서는 CTA 비활성 + 인라인 에러 메시지를 일관 적용한다. 모임명 placeholder 모순도 함께 해소한다.

**Independent Test**: 모임 생성(`/create`), 참여자 이름 등록(`/meet/[id]/register`), 참여자 이름 수정(`/meet/[id]/edit`) 페이지 각각에서 `김 길동` 타이핑 시 에러 없음, 공백만(`"   "`) 입력 시 CTA 비활성 + 에러 메시지 노출. 모임 생성의 모임명 칸은 추가로 `""`(완전 빈) → placeholder fallback 유지.

### Implementation for User Story 1 — 모임 생성

- [x] T002 [US1] `src/features/meet-create/model/useMeetCreateForm.ts` 의 모임장 검증 정규식을 `^[ㄱ-힣a-zA-Z]*$` → `^[ㄱ-힣a-zA-Z ]*$` 로 수정 (`validateHostName` 내부 `koreanEnglishOnly`).
- [x] T003 [US1] 동일 파일의 모듈 상수 `MEETING_NAME_REGEX` 를 `/^[ㄱ-힣a-zA-Z0-9]*$/` → `/^[ㄱ-힣a-zA-Z0-9 ]*$/` 로 수정.
- [x] T004 [US1] 동일 파일의 `validateHostName` (또는 `handleHostNameChange`) 에 분기 추가: `value !== '' && value.trim() === ''` 이면 `setHostNameError('공백만 입력할 수 없어요')` 설정, 그 외 정규식 위반 시 기존 메시지("한글, 영문만 입력 가능해요"), 통과 시 에러 클리어. (FR-003-host-ws)
- [x] T005 [US1] 동일 파일의 `handleMeetingNameChange` 안에 분기 추가: `newValue !== '' && newValue.trim() === ''` 이면 `setMeetingNameError('공백만 입력할 수 없어요')` 설정, 그 외 정규식 검증은 기존 로직 유지. (FR-003b)
- [x] T006 [US1] 동일 파일의 `isValid` 계산에 두 플래그 도입 — `isHostNameEmptyTrimOnly = hostName !== '' && hostName.trim() === ''`, `isMeetingNameEmptyTrimOnly = meetingName !== '' && meetingName.trim() === ''` — 그리고 `isValid` 에 `&& !isHostNameEmptyTrimOnly && !isMeetingNameEmptyTrimOnly` 를 추가. `handleSubmit` 의 `meetingName.trim() || meetingNamePlaceholder` 분기는 변경하지 않는다 (FR-003a 유지).

### Implementation for User Story 1 — 참여자 이름 등록

- [x] T007 [P] [US1] `src/features/participant-register-name/model/useParticipantRegisterName.ts` 의 `REGEX_NAME` 을 `/^[ㄱ-힣a-zA-Z]*$/` → `/^[ㄱ-힣a-zA-Z ]*$/` 로 수정.
- [x] T008 [US1] 동일 파일의 `handleNameChange` 에 분기 추가: 정규식 통과 시에도 `value !== '' && value.trim() === ''` 이면 `setErrorDetails({ isError: true, message: '공백만 입력할 수 없어요' })` 로 인라인 에러를 표시 (현재는 트림 후 빈 값은 `handleSubmit` 까지 가서야 "이름을 입력해주세요" 가 떴음 — 즉시 노출로 일관 적용).
- [x] T009 [US1] 동일 파일의 반환 `isValidInput` 을 `name.length > 0 && !errorDetails.isError` → `name.trim().length > 0 && !errorDetails.isError` 로 강화하여 공백-only 입력에서도 CTA가 비활성이 되도록 한다.

### Implementation for User Story 1 — 참여자 이름 수정

- [x] T010 [P] [US1] `src/features/participant-edit-name/model/useParticipantEditName.ts` 에 T007~T009 와 동일한 3가지 변경을 적용 (정규식 공백 추가 + `handleNameChange` 공백-only 분기 + `isValidInput` 강화). 메시지 문구는 등록과 동일하게 통일.

### Tests & 수동 검증 for User Story 1

- [ ] T011 [US1] `src/features/meet-create/model/useMeetCreateForm.test.ts` 신규 작성 (Vitest + `@testing-library/react` 훅 렌더). 다음 케이스를 포함:
  - 모임장 `김 길동` 입력 → `hostNameError === ''` 와 `isValid === true` (모임명 빈 상태 가정)
  - 모임장 `'   '` 입력 → `hostNameError === '공백만 입력할 수 없어요'`, `isValid === false` (FR-003-host-ws)
  - 모임명 `멋쟁이들 모임` 입력 → `meetingNameError === ''`
  - 모임명 `'   '` 입력 → `meetingNameError === '공백만 입력할 수 없어요'`, `isValid === false`
  - 모임명 `''` 입력 → `meetingNameError === ''`, `isValid === true` (모임장 OK 가정)
  - 모임장 `김!길동` 입력(특수문자) → 에러 메시지 그대로 유지 (회귀 0 확인, FR-007)
  - 모임장 11자 입력 시도 → 10자에서 멈춤 (`maxLength=10` 유지, FR-006)
- [ ] T012 [P] [US1] `src/features/participant-register-name/model/useParticipantRegisterName.test.ts` 신규 작성 (필수) — `김 길동` 입력 / `'   '` 입력(에러 + isValidInput=false) / 빈 입력(isValidInput=false) / 특수문자 입력 / 11자 maxLength 5 케이스로 회귀 보강. `checkParticipantExist` 는 `vi.mock` 으로 우회.
- [ ] T013 [P] [US1] `src/features/participant-edit-name/model/useParticipantEditName.test.ts` 신규 작성 (필수) — T012 와 동일 패턴.
- [ ] T014 [US1] **수동 검증**: `npm run dev` 후 [quickstart.md](./quickstart.md) §1 시나리오를 모임 생성 / 참여자 등록 / 참여자 수정 3 페이지에서 모두 종주. 4 필드 공백-only 입력 시 동일 에러 문구가 노출되는지 확인.

**Checkpoint**: US1 머지 가능. spec FR-001 ~ FR-007 (FR-003-host-ws 포함) / Acceptance Scenario 1~10 충족.

---

## Phase 4: User Story 2 — 시간 슬롯 행 라벨 두 자리수 표시 (Priority: P2)

**Goal**: `TimeSlotGrid` 와 `HeatmapGrid` 좌측 시 라벨이 항상 `00`~`23` 두 자리수로 표시.

**Independent Test**: 시간 범위에 `00:00~06:00` 또는 `01:30~04:30` 같은 한 자리 시각을 포함한 모임을 만들어, 참여자 시간 슬롯 그리드와 결과 히트맵 그리드의 좌측 라벨이 모두 `00`, `01`, …, `09`, `10`, …, `23` 두 자리로 표시되는지 확인. 라벨 폭/정렬 비뚤어짐 0건.

### Implementation for User Story 2

- [x] T015 [P] [US2] `src/features/participant-register-time-slot/ui/TimeSlotGrid.tsx` 의 좌측 `role='rowheader'` 블록 내부 `{group.hour}` 를 `{String(group.hour).padStart(2, '0')}` 로 교체 (현재 line 126). 라벨 폭(`TIME_COL_W=40`), 행 높이(`SLOT_H`/`HOUR_H`) 등 다른 코드는 손대지 않는다 (FR-010).
- [x] T016 [P] [US2] `src/features/meet-result-table/ui/HeatmapGrid.tsx` 의 좌측 `role='rowheader'` 블록 내부 `{group.hour}` 를 `{String(group.hour).padStart(2, '0')}` 로 교체 (현재 line 131). 동일하게 레이아웃 상수 불변.
- [x] T017 [US2] Storybook 확인 — `src/features/meet-result-table/ui/HeatmapGrid.stories.tsx` 와 `ResultTableView.stories.tsx` 의 stories args 중 `timeRange.startTime` 이 `00:00` 또는 한 자리 시각 영역을 포함하는 케이스가 있는지 확인. 없으면 새벽 시간 케이스 story args 1개를 추가.
- [ ] T018 [US2] **수동 검증**: [quickstart.md](./quickstart.md) §2 시나리오를 따라 호스트 흐름(`TimeSlotGrid`) + 결과 페이지(`HeatmapGrid`) + Storybook 시각 회귀를 확인. 변경 전/후 좌측 라벨 폭이 동일한지 (FR-010 라벨 레이아웃 불변) 한 번 더 눈으로 확인.

**Checkpoint**: US2 머지 가능. spec FR-008 ~ FR-010 / Acceptance Scenario 1~3 충족.

---

## Phase 5: User Story 3 — 결과 페이지 뷰 토글 아이콘 시안 일치 (Priority: P3)

**Goal**: `ViewToggle.tsx` thumb 내부 SVG 아이콘 두 상태(grid / calendar)를 Figma 시안 [3639:20842](https://www.figma.com/design/3QGpLOWvN7ZvBpYhqqzcJ4/moit-UI-Design?node-id=3639-20842&m=dev) / [3650:30362](https://www.figma.com/design/3QGpLOWvN7ZvBpYhqqzcJ4/moit-UI-Design?node-id=3650-30362&m=dev) 와 일치시킨다. 동작·색상·슬라이드 인터랙션은 유지.

**Independent Test**: 결과 페이지(`/meet/[meetingId]`)에서 토글 두 상태 각각의 thumb 아이콘이 Figma 시안과 시각적으로 일치하는지 디자이너 OK 1회 통과.

### Implementation for User Story 3

- [x] T019 [US3] Figma MCP 로 토글 아이콘 자산 추출:
  - `mcp__claude_ai_Figma__get_design_context` 로 fileKey `3QGpLOWvN7ZvBpYhqqzcJ4`, nodeId `3639:20842` 호출 → grid 상태 thumb 의 아이콘 SVG 마크업 확보.
  - 동일 메서드로 nodeId `3650:30362` 호출 → calendar 상태 thumb 의 아이콘 SVG 마크업 확보.
  - 만약 thumb pill 만 반환되면 부모/형제 노드 또는 `forceCode: true` 옵션으로 재호출해 아이콘 SVG path 를 확보.
- [x] T020 [US3] `src/features/meet-result-table/ui/ViewToggle.tsx` 의 `isCalendar` 분기(2개 인라인 SVG 블록, 현재 line 27-81)를 T019 에서 얻은 SVG path/그룹으로 교체. `width`, `height`, `viewBox` 는 시안 자산 크기에 맞추되 thumb 가시 영역(`flex h-6 w-6` ≒ 24px) 안에 잘 들어맞도록 조정. stroke/fill 컬러는 기존 `#3C7EFA` 톤 유지 또는 시안에 명시된 토큰으로 변경.
- [x] T021 [US3] 토글 동작 유지 검증 — `aria-checked`, `translate-x-[22px]` 슬라이드, `bg-slate-200` rail 색상이 그대로인지 코드 diff 로 재확인. **아이콘 외 변경 0**.
- [ ] T022 [US3] **수동 검증**: [quickstart.md](./quickstart.md) §3 시나리오를 따라 토글 두 상태 시각 비교. 가능하면 디자이너에게 1회 확인 요청.

**Checkpoint**: US3 머지 가능. spec FR-011 ~ FR-012 / Acceptance Scenario 1~2 충족.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: 머지 직전 회귀·문서·linting 마무리.

- [x] T023 [P] `npm run lint` 통과 확인.
- [x] T024 [P] `npx tsc --noEmit` (또는 `npm run typecheck` 이 있다면 해당 스크립트) 통과 확인.
- [x] T025 [P] `npm test` 통과 확인 (T011 ~ T013 신규 테스트 포함). (T011~T013 미작성: testing-library/react 미설치 — 추후 결정 필요)
- [ ] T026 [quickstart.md](./quickstart.md) §1~§3 시나리오를 dev 서버에서 1회 종주 — 모임 생성 → 참여자 이름 등록 → 날짜 → 시간 → 투표 → 결과 페이지 → 참여자 이름 수정 전 구간 회귀 0 확인.
- [ ] T027 `git add -p` 로 본 작업에 해당하는 hunk 만 staging → user story 별 commit 권장 (예: `fix(meet-create): allow space and surface whitespace-only error in host/meeting name #87`, `fix(participant-name): allow space and add whitespace-only guard in register/edit name flows #87`, `style(time-slot-grid): pad hour labels to two digits #87`, `style(view-toggle): sync thumb icon with Figma #87`).
- [ ] T028 PR 생성 — base `develop`, head `feat/#87-meet-figma-sync-fixes`. PR 본문에 spec FR/Acceptance Scenario 충족 여부 체크리스트 + quickstart 결과 + Figma 시안 노드 링크 첨부.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 브랜치 확인만. 즉시 시작 가능.
- **Phase 2 (Foundational)**: 작업 없음 — User Story 들이 서로 독립이라 공통 전제 조건이 없다.
- **Phase 3 (US1)**: Setup 후 즉시 시작 가능. US2/US3 와 독립.
- **Phase 4 (US2)**: Setup 후 즉시 시작 가능. US1/US3 와 독립.
- **Phase 5 (US3)**: Setup 후 즉시 시작 가능. US1/US2 와 독립. Figma MCP 자산 추출 필요.
- **Phase 6 (Polish)**: 위 3개 user story 머지 후.

### User Story Dependencies

3개 user story 모두 서로 다른 파일에서 독립적으로 작업되며 cross-story dependency 가 없다 — 각각 별도 PR/커밋으로 머지 가능.

| Story | 수정 파일                                                                                                                                                                                                                     | 다른 Story 의존              |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| US1   | `src/features/meet-create/model/useMeetCreateForm.ts`, `src/features/participant-register-name/model/useParticipantRegisterName.ts`, `src/features/participant-edit-name/model/useParticipantEditName.ts` + 단위 테스트(신규) | 없음                         |
| US2   | `src/features/participant-register-time-slot/ui/TimeSlotGrid.tsx`, `src/features/meet-result-table/ui/HeatmapGrid.tsx`, 관련 stories                                                                                          | 없음                         |
| US3   | `src/features/meet-result-table/ui/ViewToggle.tsx`                                                                                                                                                                            | 없음 (Figma MCP 자산만 필요) |

### Within Each User Story

- US1: T002 → T003 → T004 → T005 → T006 는 **동일 파일**(useMeetCreateForm.ts) 순차. T007~T009 (참여자 등록 한 파일 — 순차) 와 T010 (참여자 수정 단일 hunk) 는 서로 다른 파일이라 `[P]` — 모임 생성 작업과 병렬 진행 가능. 이후 T011·T012·T013 (테스트, 별개 신규 파일들) `[P]` → T014 (수동 검증).
- US2: T015·T016 은 서로 다른 파일이라 `[P]` 병렬 가능. T017 (Storybook 확인) → T018 (수동 검증).
- US3: T019 (자산 추출) → T020 (교체) → T021 (회귀 가드) → T022 (수동 검증) 순차.

### Parallel Opportunities

- **Phase 3 내**: T007~T009(참여자 등록 한 파일 — 순차) ↔ T010(참여자 수정 단일 변경) ↔ T002~T006(모임 생성 한 파일 — 순차) 가 서로 다른 3개 파일에 걸쳐 있어 **세 묶음을 병렬로 진행 가능**. T011·T012·T013 (테스트) 도 서로 다른 신규 파일이라 `[P]`.
- **Phase 4 내**: T015 ↔ T016 병렬.
- **Phase 6 내**: T023 / T024 / T025 병렬 (각각 lint / typecheck / test 독립 명령).
- **User Story 간**: Phase 3/4/5 자체가 서로 독립이라 인력 여유 있으면 동시 진행 가능. 단 본 폴리시는 1인 작업 분량이라 순차 진행 권장.

---

## Parallel Example: User Story 1 — 3 흐름 동시 진행

```bash
# 모임 생성 / 참여자 등록 / 참여자 수정 — 서로 다른 3개 파일이라 동시 진행 가능

Task A: src/features/meet-create/model/useMeetCreateForm.ts
  순차: T002 → T003 → T004 → T005 → T006

Task B: src/features/participant-register-name/model/useParticipantRegisterName.ts
  순차: T007 → T008 → T009

Task C: src/features/participant-edit-name/model/useParticipantEditName.ts
  T010 (3가지 변경을 한 hunk 로)
```

## Parallel Example: User Story 2

```bash
# T015·T016 는 다른 파일이라 두 편집을 한 번에 묶을 수 있다
# (한 PR 안에서 동시 변경하되, 단일 커밋 또는 hunk 분리)

Task: src/features/participant-register-time-slot/ui/TimeSlotGrid.tsx
  Edit: {group.hour} → {String(group.hour).padStart(2, '0')}

Task: src/features/meet-result-table/ui/HeatmapGrid.tsx
  Edit: {group.hour} → {String(group.hour).padStart(2, '0')}
```

## Parallel Example: Phase 6 검증

```bash
npm run lint &
npx tsc --noEmit &
npm test &
wait
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

본 폴리시의 MVP 는 US1(공백 입력 허용 + 모임명 모순 해소). 사용자 흐름을 실제로 막고 있는 유일한 이슈이기 때문이다.

1. Phase 1 (브랜치 확인) 완료.
2. Phase 3 (US1) 완료 → 단위 테스트 통과 + quickstart §1 수동 검증 통과.
3. **STOP & VALIDATE**: 모임명 placeholder 모순이 해소되어 사용자가 진행 막힘 없이 모임을 생성할 수 있는지 확인.
4. 머지 가능 시 PR 생성.

### Incremental Delivery

1. US1 머지 (가장 큰 가치) → 단독 PR 가능.
2. US2 머지 (시각 폴리시) → 단독 PR 가능.
3. US3 머지 (토글 아이콘) → 단독 PR 가능 (Figma 자산 추출이 별도 시간 소요).
4. 또는 **3개를 한 PR**로 묶어도 무방 — spec 단계에서 사용자가 "하나의 명세로 묶기" 선택했으므로 한 PR 권장.

### Parallel Team Strategy

본 폴리시는 1인 작업 분량 (~수 시간). 별도 인력 분배 없이 순차 진행.

---

## Notes

- 본 작업은 **클라이언트 UI/검증 폴리시 한정** — 백엔드 스키마/API/마이그레이션 없음.
- 데이터 모델/엔티티/위젯 신규 추가 없음. 신규 파일은 단위 테스트 1개(권장)만.
- 정규식 변경 시 spec Out of Scope(전각 공백/NBSP 미허용)를 깨뜨리지 않도록 **반드시 ASCII 공백 한 문자만** 추가.
- `padStart` 인라인 식을 util로 분리하지 않는다 (research.md R-4).
- 토글 아이콘은 인라인 SVG 유지 — `shared/ui/icons/` 추출 없음 (research.md R-5).
- 커밋은 conventional commits (`fix:`/`style:`/`test:` 접두) + `#87` 이슈 참조.
- PR 머지 전 `quickstart.md` 모든 시나리오 1회 종주.
