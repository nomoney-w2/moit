# Tasks: vote-rank-cards API 연동 및 잔여작업 통합

**Feature Branch**: `feat/#73-vote-rank-cards-api`
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Data Model**: [data-model.md](./data-model.md)
**Contracts**: [contracts/README.md](./contracts/README.md)
**Quickstart**: [quickstart.md](./quickstart.md)

**User constraint (사용자 명시 제약)**: 미사용하게 될 파일·더미 데이터는 **삭제하지 않고 deprecation 주석만 추가**한다. 실제 삭제는 별도 정리 PR(TODO-9).

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일·기존 미완 의존 없음, 병렬 실행 가능
- **[Story]**: US1, US2, US3 — Setup/Foundational/Polish 단계는 라벨 없음

## Path Conventions

Single Next.js app, FSD layered. 모든 경로는 `/Users/yejin/Desktop/moit/` 기준 상대.

```
src/app/                           # Next.js routing (thin pages)
src/features/{feature}/{ui|model|lib}/
src/entities/{entity}/{api|dto|lib}/
src/shared/{ui|lib|api|...}/
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 베이스라인 확인. 신규 인프라는 없음 (기존 next/typescript/zod/ky/vitest 환경 그대로 사용).

- [x] T001 현재 브랜치가 `feat/#73-vote-rank-cards-api`인지 확인하고, `npm install` 후 `npx tsc --noEmit` 으로 베이스라인 타입 체크 통과 확인
- [x] T002 의존 PR(#71, #72)이 본 브랜치 히스토리에 포함됐는지 확인 (`git log --oneline | head -20`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 user story가 의존하는 DTO 확장. 이 phase가 끝나야 어댑터·페이지 변경이 type-safe.

**⚠️ CRITICAL**: T003 완료 전에는 어떤 user story task도 시작 불가.

- [x] T003 `src/entities/meet/dto/meet.dto.ts` 에 다음 zod 스키마 확장 (data-model.md §1):
  - `timeRangeWithSlotCountDto` 신규 추가 (`startTime`, `endTime`, `slotCount`)
  - `meetingStatusEnum` 신규 추가 (`'VOTING' | 'FINALIZED' | 'CLOSED'`)
  - `participantDto` 에 `voteTimeSlots: z.array(z.array(z.boolean())).default([])` 추가
  - `meetResponseDto` 에 `status`, `finalizedDate?: nullable`, `timeRange?: nullable` 추가
  - 모든 신규 export type 추가 (`MeetingStatus`, `MeetingTimeRangeWithSlotCount` 등)
- [x] T004 `src/entities/meet/api/meet.query.example.ts` 의 mock 응답이 새 필드 포함하도록 갱신 (없으면 vitest 깨짐 방지)
- [x] T005 `npx tsc --noEmit` 로 DTO 변경 후 기존 호출 사이트 타입 호환성 확인. 깨지는 곳 있으면 임시 fallback (`?? null`, `?? 0`) 만 적용하고 주석으로 표시
- [x] T006 [P] `src/shared/lib/date.ts` 의 `parseDate` export 확인 (이미 있음). 신규 어댑터에서 사용 예정이므로 import path 점검만

**Checkpoint**: DTO 확장 완료 → user story 작업 시작 가능

---

## Phase 3: User Story 1 — 실 데이터로 카드/캘린더 보기 (Priority: P1) 🎯 MVP

**Goal**: `/meet/{meetingId}` 페이지가 mock 시드가 아닌 실 API 응답으로 동작. timeRange 유무에 따라 시간대 뷰 또는 날짜 캘린더 뷰로 분기.

**Independent Test**: sandbox 모임 ID로 `/meet/{id}` 진입 → 카드의 가능자 수·명단이 응답 데이터와 100% 일치 + DevTools에서 `GET /api/v1/meeting` 1회만 호출.

### Tests for User Story 1 (data-model.md §7 매트릭스)

- [x] T007 [P] [US1] `src/entities/meet/lib/toMeetingVoteSnapshot.test.ts` 신규 작성: (a) 정상 변환 9명·4슬롯, (b) `participants=[]`, (c) `voteTimeSlots` 차원 mismatch fallback, (d) `timeRange=null + strict=true` → throw
- [x] T008 [P] [US1] `src/entities/voteTimeSlotStat/lib/buildVoteTimeSlotStat.test.ts` 신규 작성: (a) 셀 수 = `dates × slotCount`, (b) `hasVoted=false` 제외, (c) 모든 셀 0표, (d) `slotCount=1` 단일 셀
- [x] T009 [P] [US1] `src/entities/voteDateStat/lib/buildVoteDateStat.test.ts` 신규 작성: (a) date별 can/cannot 분류, (b) `hasVoted=false` 제외, (c) dates 정렬 보장, (d) 모든 참여자 `voteDates=[]`

### Implementation for User Story 1

- [x] T010 [P] [US1] `src/entities/meet/lib/toMeetingVoteSnapshot.ts` 신규 구현 (data-model.md §3): `MeetResponse → MeetingVoteSnapshot` 어댑터. 시그니처는 `(meet, options?: { strict?: boolean }) => MeetingVoteSnapshot`. 내부에 `normalizeVoteTimeSlots` 헬퍼 포함 (research.md R-3).
- [x] T011 [P] [US1] `src/entities/voteTimeSlotStat/lib/buildVoteTimeSlotStat.ts` 신규 구현 (data-model.md §4): `MeetResponse → VoteTimeSlotStat`. `participants[].voteTimeSlots` 로 `cells[]` 합성.
- [x] T012 [P] [US1] `src/entities/voteDateStat/lib/buildVoteDateStat.ts` 신규 구현 (data-model.md §5): `MeetResponse → VoteDateStat[]`. 날짜별 `voteDates.includes(date)` 분류.
- [x] T013 [US1] `src/app/meet/[meetingId]/page.tsx` 변경 (T010~T012, T013a 의존). page.tsx는 **server component 유지** (FR-012, SC-008):
  - `buildMockSnapshot(meetingData)` → `toMeetingVoteSnapshot(meetingData)` 교체
  - `generateMockVoteTimeSlotStat(meetingId, sortedDates)` → `buildVoteTimeSlotStat(meetingData)` 교체
  - `meetingData.timeRange ? <MeetResultTablePage .../> : <MeetResultCalendarClient dateStats={buildVoteDateStat(meetingData)} />` 분기 추가
  - 진입 시 `getMeetingById` 실패 처리: 404 응답을 try/catch 후 `notFound()` 호출. 5xx는 그대로 throw하여 `error.tsx`에 위임 (T015d)
  - **회귀 검증**: page.tsx가 'use client' 디렉티브 없이 server component로 유지되는지, `generateMetadata` 가 빌드 시 server에서 실행되는지 확인 (NFR-001, SC-008)
- [x] T013a [US1] `src/app/meet/[meetingId]/MeetResultCalendarClient.tsx` 신규 client wrapper 컴포넌트 생성 (plan.md AD-7). `'use client'` 디렉티브 + props `{ dateStats: VoteDateStat[] }`. 내부에서 `useState(selectedDate)`·`useRef(calendarRef)` 로 `VoteResultsShell` + `ReactDatepicker` 조합. 기존 `VoteResultsShell.stories.tsx`의 표준 결합 패턴을 참고
- [x] T014 [US1] `src/app/meet/[meetingId]/page.tsx` 의 `buildMockSnapshot` 함수와 `hashSeed`/`mulberry32`/`VISUAL_NAMES`/`VISUAL_POOL_SIZE` 상수에 deprecation 주석 추가 (research.md R-8 표준 포맷). 코드는 보존.
- [x] T015a [US1] `src/app/meet/[meetingId]/loading.tsx` 신규 추가 (FR-003): TopBar·푸터 자리 차지 + 본문 스켈레톤 카드 3개. server component (Next.js 표준 loading 컨벤션)
- [x] T015b [US1] `src/app/meet/[meetingId]/error.tsx` 신규 추가 (FR-004): `'use client'` + props `{ error, reset }`. 사용자 친화 안내 + "다시 시도" 버튼이 `reset()` 호출. 5xx·네트워크 오류 처리

**Checkpoint**: User Story 1 완료 시 quickstart.md Scenario 1·2·3·4 통과

---

## Phase 4: User Story 2 — 표·카드 토글 동작 (Priority: P2)

**Goal**: 토글 자체는 PR #133 단계에서 이미 결합됨. 본 phase는 T013의 timeRange 분기와 결합해 (a) timeRange 있는 모임 = 토글 노출 동작, (b) timeRange 없는 모임 = 토글 미노출 동작 검증.

**Independent Test**: timeRange 있는 모임 ID로 진입 → 표 ↔ 카드 토글 클릭 시 같은 데이터 양쪽 일치. timeRange 없는 모임 → 토글 자체 미노출 + 캘린더 뷰만.

- [ ] T016 [US2] quickstart.md Scenario 1 의 토글 동작 manual QA: 표 → 카드 전환 시 같은 모임 데이터 기준으로 1위가 양쪽 동일하게 강조되는지
- [ ] T017 [US2] quickstart.md Scenario 2 manual QA: timeRange 미선택 모임에서 시간대 토글 자체가 노출되지 않고 캘린더 뷰만 보이는지
- [ ] T018 [US2] 새로고침 시 기본 뷰(표) 복귀 확인 (Clarifications: localStorage 영속화 안 함)

**Checkpoint**: User Story 1 + 2 모두 동작 = `/meet/{id}` 페이지 운영 사용 가능 상태

---

## Phase 5: User Story 3 — PR #72 follow-up 정리 (Priority: P2)

**Goal**: PR #72 리뷰의 잔여 항목을 코멘트 + 1개 테스트 추가로 완료. 사용자 가시 변화는 없으나 향후 정리 PR을 위한 발판.

**Independent Test**: deprecation 주석 후 `npm run lint && npx tsc --noEmit && npx vitest run` 모두 통과. `rankSlots` 신규 테스트 케이스 통과.

### Deprecation 주석 추가 (전부 [P] — 서로 다른 파일)

- [x] ~~T019 [P] [US3] `src/features/vote-rank-cards/lib/types.ts` 의 `RankBadgeGroup` 타입과 `RankedSlot.badgeGroup` 필드에 deprecation 주석~~ → **취소.** [2edab5e](https://github.com/nomoney-w2/moit/commit/2edab5e)에서 `badgeGroup`을 single source로 통합. deprecation 대신 ALIVE 처리됨. 본 task는 reality에 맞게 무효.
- [x] ~~T020 [P] [US3] `src/features/vote-rank-cards/lib/toRankedSlots.ts` 의 `mapBadgeGroup` 함수와 그 호출 부분(L133, L168)에 deprecation 주석~~ → **취소.** 위와 같은 이유. `mapBadgeGroup`이 single source로 살아남음.
- [x] T021 [P] [US3] `src/features/vote-rank-cards/model/useVoteRankCardToggle.ts` 의 `isOpen` 콜백 → **완전 제거 완료** ([351104d](https://github.com/nomoney-w2/moit/commit/351104d)). spec의 deprecation 주석 결정보다 한 단계 진전된 처리.
- [x] T022 [P] [US3] `src/features/vote-rank-cards/lib/mock.ts` 파일 상단에 deprecation 주석 (test 라우트·storybook 전용). 동작 보존.
- [x] T023 [P] [US3] `src/features/vote-rank-cards/ui/VoteRankCardsPage.tsx` 파일 상단에 deprecation 주석 (운영은 `MeetResultTablePage` 사용).
- [x] T024 [P] [US3] `src/app/test/vote-rank-cards/page.tsx` 파일 상단에 deprecation 주석 (개발용 라우트, 시각 회귀는 storybook으로 대체 가능 명시).
- [x] T025 [P] [US3] `src/entities/voteTimeSlotStat/api/fetchVoteTimeSlotStat.ts` 의 throw 함수에 deprecation 주석 (서버 엔드포인트 부재, `buildVoteTimeSlotStat` 대체).
- [x] T026 [P] [US3] `src/entities/voteTimeSlotStat/lib/mock.ts` 의 `generateMockVoteTimeSlotStat` 함수에 deprecation 주석 (`buildVoteTimeSlotStat` 대체).
- [x] T027 [P] [US3] `src/entities/voteDateStat/api/fetchVoteDateStat.ts` 의 throw 함수에 deprecation 주석 (서버 엔드포인트 부재, `buildVoteDateStat` 대체).

### 테스트 갭 메우기 (FR-011, SC-006)

- [x] T028 [US3] `src/features/vote-rank-cards/lib/rankSlots.test.ts` 과거 날짜 보조정렬 테스트 → **완료** ([300a7e2](https://github.com/nomoney-w2/moit/commit/300a7e2)). 케이스 `'동률 그룹 내 과거 날짜는 미래 날짜 뒤로 밀림'` 추가됨.

**Checkpoint**: User Story 3 완료 시 SC-005·SC-006·SC-007 충족

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 통합 검증, 회귀 보호, 운영 환경 smoke test.

- [x] T029 [P] `npx vitest run src/entities/meet/lib/ src/entities/voteTimeSlotStat/lib/ src/entities/voteDateStat/lib/ src/features/vote-rank-cards/lib/` 로 신규+변경 테스트 일괄 통과 확인 (quickstart.md Scenario 6)
- [x] T030 [P] `npm run lint` 통과 확인 (deprecation 주석이 ESLint `deprecation/deprecation` 규칙에 걸리는지 점검 — 본 작업 코드에서 호출하지 않으면 OK)
- [x] T031 [P] `npx tsc --noEmit` 전체 타입 체크 통과
- [ ] T032 quickstart.md Scenario 1·2·3·4 manual QA (timeRange 있/없 모임 각 1건 + 빈 상태 + 오류 케이스)
- [ ] T033 [P] quickstart.md Scenario 5: `/test/vote-rank-cards` 진입해 deprecation 주석에도 mock 기반 시각 회귀 정상 확인
- [ ] T034 [P] quickstart.md Scenario 7: `npm run storybook` → `Features/VoteRankCards/*` 와 `Features/MeetResultTable/*` stories 시각 회귀 0건
- [ ] T035 (배포 후) quickstart.md Scenario 8: 운영 모임 1건의 결과 페이지 진입해 zod validation error 0건, `voteTimeSlots`/`timeRange.slotCount`/`status` 응답 존재 확인
- [ ] T036 PR 본문에 본 spec과 plan의 TODO-1~9를 명시적으로 carry-over로 기재 (별도 정리 PR 시 추적 가능하도록)

---

## Dependencies

```
T001 (Setup)
   └── T002 (Setup)
         └── T003 (Foundational: DTO extension) ⚠️ ALL stories block here
               ├── T004, T005, T006 (Foundational follow-ups)
               │
               ├──→ Phase 3 (US1)
               │      ├── T007 ⫷ T008 ⫷ T009 (tests, parallel)
               │      ├── T010 ⫷ T011 ⫷ T012 (adapters, parallel)
               │      ├── T013a (MeetResultCalendarClient wrapper) — depends on T012
               │      ├── T013 (page.tsx wiring + 분기 + notFound) — depends on T010, T011, T013a
               │      ├── T014 (deprecation 주석 in page.tsx) — depends on T013
               │      └── T015a ⫷ T015b (loading.tsx, error.tsx — parallel)
               │
               ├──→ Phase 4 (US2) — depends on T013 완료
               │      ├── T016, T017, T018 (manual QA)
               │
               ├──→ Phase 5 (US3) — independent of T013, can run parallel to Phase 3
               │      ├── T019~T027 (deprecation 주석, all parallel)
               │      └── T028 (rankSlots test)
               │
               └──→ Phase 6 (Polish) — depends on Phase 3·5 완료
                      ├── T029~T031 (자동화 검증, parallel)
                      ├── T032 (manual QA)
                      ├── T033, T034 (storybook/test route 회귀)
                      ├── T035 (배포 후 smoke test)
                      └── T036 (PR 본문 TODO carry-over)
```

### Story 완료 순서 (MVP 배달)

1. **MVP**: Phase 1 → 2 → 3 (US1) → 6 부분 (T029~T032) — 운영 가능 상태
2. **+US2 검증**: T016~T018 (US1 머지 후 매뉴얼 QA로 즉시 확인)
3. **+US3 정리**: Phase 5 (US3) 는 US1과 독립적이므로 병렬 PR 또는 같은 PR에 묶을 수 있음

---

## Parallel Execution Examples

### Phase 3 (US1) 의 어댑터 3종 동시 작성

```
# 다른 파일이고 의존 없음, 동시 작업 가능
T010 [P] [US1] toMeetingVoteSnapshot.ts
T011 [P] [US1] buildVoteTimeSlotStat.ts
T012 [P] [US1] buildVoteDateStat.ts
```

테스트 3종도 동일하게 병렬:

```
T007 [P] [US1] toMeetingVoteSnapshot.test.ts
T008 [P] [US1] buildVoteTimeSlotStat.test.ts
T009 [P] [US1] buildVoteDateStat.test.ts
```

### Phase 5 (US3) 의 deprecation 주석 9건 동시 추가

```
T019~T027 모두 [P] — 서로 다른 파일에 주석만 추가, 의존 없음
```

### Phase 6 의 자동화 검증 3종 동시 실행

```
T029 [P] vitest 통과
T030 [P] lint 통과
T031 [P] tsc 통과
```

---

## Implementation Strategy (제안)

### Path A — 단일 PR (권장)

US1 + US3 을 같은 PR로 묶고, US2 는 manual QA로만 검증. 이유: deprecation 주석은 본 작업 컨텍스트에 직접 종속(`buildMockSnapshot` 대체와 같은 시점), 별도 PR 분리 시 리뷰 문맥 손실.

순서:

1. Foundational (T003~T006) → 머지 가능 상태로 만들고 push
2. US1 어댑터 3종 + 테스트 (T007~T012) — 병렬
3. US1 page.tsx 결합 (T013~T015)
4. US3 deprecation 주석 일괄 (T019~T027) + 테스트 추가 (T028)
5. Polish (T029~T034)
6. PR 머지 → 배포 → T035 smoke test

### Path B — 분할 PR

PR-A: Foundational + US1 (T003~T015 + T029~T032)
PR-B: US3 정리 (T019~T028)

장점: PR-A 가 빨리 머지돼 운영 노출. 단점: US3 가 별도 리뷰 문맥에서 진행되어 본 spec 의도(같이 정리) 가 흐려짐.

→ **Path A 권장.** spec scope 결정에서 사용자가 "API 연동 + 잔여작업 통합" 옵션을 선택했으므로.

---

## Validation Checklist (tasks.md 자체 검증)

- [x] 모든 task 가 `- [ ] T### [P?] [Story?] ...` 포맷 준수
- [x] Setup/Foundational/Polish 단계는 [Story] 라벨 없음
- [x] User Story phase 의 모든 task 는 [US?] 라벨 보유
- [x] 각 task 에 명확한 file path 포함
- [x] [P] 표시는 동일 파일 충돌·미완료 의존 없는 task 에만 부여
- [x] User Story 1 (P1) 만으로도 독립적으로 MVP 가치 전달 가능 (timeRange 있/없 모임 모두 실 데이터로 결과 페이지 동작)
- [x] data-model.md §7 의 단위 테스트 매트릭스 모든 케이스가 task 로 매핑됨
- [x] contracts/README.md 의 `GET /api/v1/meeting` 가 T003 의 DTO 확장으로 매핑됨
- [x] research.md 의 R-1 ~ R-8 결정이 모두 task 로 반영됨

---

## Summary

| 항목                       | 값                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| **Total tasks**            | 38                                                                                          |
| **Setup**                  | 2 (T001-T002)                                                                               |
| **Foundational**           | 4 (T003-T006)                                                                               |
| **US1 (P1, MVP)**          | 11 (T007-T015b — T013a/T015a/T015b 추가, 기존 T015 → T015a/b로 분할)                        |
| **US2 (P2)**               | 3 (T016-T018, manual QA)                                                                    |
| **US3 (P2)**               | 10 (T019-T028)                                                                              |
| **Polish**                 | 8 (T029-T036)                                                                               |
| **Parallel opportunities** | US1 어댑터 3종 + 테스트 3종, T015a⫷T015b, US3 deprecation 9건, Polish 검증 3종              |
| **MVP scope**              | T001~T015b + T029~T032 (≈22 tasks)                                                          |
| **Estimated effort**       | 본격 코드 변경은 T010~T013a (5 files), loading/error.tsx 2 files, 나머지는 주석·테스트·검증 |
