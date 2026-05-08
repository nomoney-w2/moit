# Feature Specification: vote-rank-cards API 연동 및 잔여작업 통합

**Feature Branch**: `feat/#73-vote-rank-cards-api`
**Created**: 2026-05-06
**Status**: Draft
**Issue**: [#73](https://github.com/nomoney-w2/moit/issues/73)
**Input**: User description: "이제 api연동을 해보려고 해. 그리고 잔여작업이 뭐인지도 해야함"

## 배경

PR #72 (closed #68) 에서 `vote-rank-cards` 피처를 시각/순위 산정 로직 단계까지 구현했다. 그러나:

- 실제 라우트(`/meet/[meetingId]`) 의 결과 영역은 mock 시드 기반 `buildMockSnapshot`으로 동작 중이며, 사용자별 시간대 투표 정보(`voteTimeSlots`)는 가짜 난수로 만들어진다.
- 시간대 집계 API(`fetchVoteTimeSlotStat`)는 throw로 미구현 상태다.
- 백엔드의 모임 조회 응답(`GET /api/v1/meeting`) 은 이미 `participants[].voteTimeSlots`, `timeRange`, `status`를 포함하지만, 프로젝트의 `meetResponseDto`가 이 필드들을 반영하지 못해 컴포넌트 입력(`MeetingVoteSnapshot`) 으로 가는 길이 끊겨 있다.
- `vote-rank-cards`의 카드 리스트 컴포넌트는 `/test/vote-rank-cards`에만 연결돼 있고, 실 페이지에는 노출되지 않았다 (`MeetResultTablePage` 만 노출). PR #72의 `ViewToggle` placeholder는 표/카드 뷰 전환을 시사한다.
- PR #72 리뷰에서 도출된 정리 항목(badgeGroup dead field, isOpen dead callback, 푸터 버튼 onClick 미연결, 과거 날짜 정렬 테스트 갭) 이 미해결이다.

본 명세는 위 격차를 한 번의 작업 단위로 좁힌다.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — 실 데이터로 카드 리스트 보기 (Priority: P1)

참여자/호스트가 모임 결과 페이지를 열면, 실제 백엔드에서 받아온 시간대별 투표 집계가 카드 리스트로 표시된다. mock 난수가 아니라 모임 참여자들이 실제로 찍은 표가 1~5위 순위와 가능/불가 명단으로 정확히 보여야 한다.

**Why this priority**: 본 spec의 핵심 가치. 카드 컴포넌트와 순위 알고리즘은 이미 PR #72에서 검증됐으므로 데이터 파이프만 실제로 흐르면 사용자에게 즉시 가치 전달이 가능하다.

**Independent Test**: 실제 모임 ID로 `/meet/[meetingId]`에 진입했을 때 (1) 모임 제목·호스트명이 노출되고 (2) 카드의 `N명이 가능해요` 수치가 백엔드 집계와 일치하며 (3) 카드를 펼쳤을 때 가능/불가 명단의 이름·순서가 백엔드 응답과 일치하는 것을 단일 시나리오로 검증할 수 있다.

**Acceptance Scenarios**:

1. **Given** 8명이 투표를 마친 모임이 있고 그 중 1번 시간대를 7명이 가능으로 찍었다, **When** 호스트가 결과 페이지를 연다, **Then** 1번 시간대 카드가 1위 뱃지와 함께 `7/8`로 표시되고, 펼치면 가능 7명·불가 1명의 실 이름이 노출된다.
2. **Given** 아무도 투표하지 않은 모임 링크가 있다, **When** 사용자가 결과 페이지를 연다, **Then** `아직 투표한 사람이 없어요` 빈 상태가 보인다.
3. **Given** 백엔드 응답이 도착 전이다, **When** 결과 페이지를 연다, **Then** 사용자에게 깨진 화면 대신 명확한 로딩 표시(스켈레톤·진행 표시) 가 보이고, 도착 후 카드로 자연 전환된다.
4. **Given** 백엔드 응답이 4xx/5xx이거나 네트워크 오류다, **When** 결과 페이지를 연다, **Then** 사용자가 상황을 이해할 수 있는 오류 안내 + 재시도 가능 동작이 제공된다.

---

### User Story 2 — 표·카드뷰 전환 (Priority: P2)

같은 결과 데이터를 히트맵 표(이미 노출 중)와 순위 카드 리스트 두 가지 뷰로 토글할 수 있다.

**Why this priority**: PR #72가 `ViewToggle` placeholder를 둔 이유. 두 뷰는 서로 보완적이며(표=시간대 전체 한눈에 / 카드=상위 후보 깊이), 하나만 노출하면 PR #72의 산출물을 일부 묻게 된다. 그러나 데이터가 흐르고 나서 가능한 후속이라 P2.

**Independent Test**: `/meet/[meetingId]` 진입 후 토글 컨트롤을 클릭하면 같은 데이터가 카드 ↔ 표로 전환되고, 한쪽에서 본 1위 시간대가 다른 쪽에서도 동일하게 1위·최다 표로 강조되는지 동일 케이스로 비교 검증 가능.

**Acceptance Scenarios**:

1. **Given** `timeRange`가 있는 모임이고 결과 페이지에 표 뷰(기본)가 보이는 상태, **When** 사용자가 토글의 카드 아이콘을 누른다, **Then** 같은 데이터가 카드 리스트로 전환되어 1~5위와 그 외가 동일 모임 데이터 기준으로 정렬된다.
2. **Given** `timeRange`가 없는 모임의 결과 페이지에 진입했다, **When** 페이지가 렌더된다, **Then** 시간대 뷰(표·카드) 토글은 노출되지 않고 기존 날짜 단위 결과 캘린더 뷰가 보인다.
3. **Given** 토글로 카드 뷰를 선택한 상태, **When** 페이지를 새로 고침한다, **Then** 기본 뷰(표) 로 복귀한다 (별도 영속화 안 함).

---

### User Story 3 — PR #72 follow-up 정리 (Priority: P2)

PR #72 코드 리뷰에서 도출된 정리 항목을 본 작업과 함께 처리한다. 사용자에게 직접 보이는 변화는 적지만, 데드 코드를 제거하고 회귀 테스트 갭을 메워 향후 변경 안전성을 높인다.

**Why this priority**: API 연동과 같은 컴포넌트·어댑터를 만지는 작업이므로 같은 PR로 처리하면 리뷰 문맥이 이어지고 별도 PR의 오버헤드가 절감된다. 단, P1이 막히면 보류 가능하므로 P2.

**Independent Test**: 별도 단위 테스트 추가/제거와 잠재적 동작 변화 없음의 실 사용 검증. 데드 코드 제거가 빌드/테스트 통과로 회귀 부재 확인 가능.

**Acceptance Scenarios**:

1. **Given** `RankedSlot.badgeGroup` 필드와 `mapBadgeGroup` 함수가 어댑터에서 사용된다, **When** 작업이 완료된다, **Then** 두 심볼에 deprecation 주석이 부여되고 운영 렌더 경로(`MeetResultTablePage` 트리)에서 `badgeGroup` / `mapBadgeGroup` 호출이 0회임이 grep 으로 확인된다 (코드 자체는 보존).
2. **Given** `useVoteRankCardToggle` 훅이 `isOpen`을 반환한다, **When** 작업이 완료된다, **Then** `isOpen` 콜백에 deprecation 주석이 부여되고 호출자가 0개임이 grep 으로 확인된다 (코드 자체는 보존, 실제 제거는 TODO-9).
3. **Given** 푸터의 `투표 수정하기` / `투표하기` 버튼이 onClick 미연결이다, **When** 작업이 완료된다, **Then** 두 버튼이 결과 페이지의 의도된 동작(예: 투표 수정 라우트 이동, 미투표자에 한해 투표 진입) 으로 연결되거나, 결과 페이지에서 노출하지 않기로 명시 결정한다.
4. **Given** `rankSlots`의 과거 날짜 보조정렬 분기가 미테스트다, **When** 작업이 완료된다, **Then** 과거 날짜 슬롯이 미래보다 뒤로 밀리는 동작이 단위 테스트로 보장된다.

---

### Edge Cases

- 모임이 종료(`status='CLOSED'` 또는 `finalizedDate` 있음)된 경우, 카드 리스트는 그대로 보이되 푸터의 투표 관련 CTA 동작이 달라질 수 있다.
- 백엔드 응답에 시간 범위(`timeRange`)가 누락된 모임 — `MeetResponse`에는 현재 timeRange가 없음. 시간대 카드는 시간 범위 없이는 의미가 없으므로 명세 단계에서 의존 결정 필요.
- 참여자 0명 / 모두 `hasVoted=false` 인 경우 빈 상태로 빠진다 (User Story 1 - Acceptance 2).
- 슬롯 수가 5장 이하·정확히 5장 동률·5장 초과 동률 — PR #72 알고리즘이 이미 처리 중이지만 실 응답 데이터로도 동일 케이스를 시뮬레이션해 회귀 검증.
- 사용자가 결과 페이지 진입 직후 다른 참여자가 투표를 추가/수정한 경우 — 새로고침 트리거 또는 명시적 갱신 정책.
- 동일 이름의 참여자가 둘 이상 있는 경우 카드 펼침의 가능/불가 명단에서 식별 — 백엔드 응답이 `id`로 구분 가능하므로 키는 안전, 라벨만 동명이인 처리 정책 결정.

---

## Clarifications

### Session 2026-05-06

- Q: 시간대별 집계 데이터를 어떤 API 형태로 받을까요? → A: Swagger 확인 결과, **`GET /api/v1/meeting?meetId=X`** 가 이미 `participants[].voteTimeSlots: boolean[][]`, `timeRange (slotCount 포함)`, `status`, `finalizedDate` 를 모두 응답함. 별도 시간대 집계 엔드포인트는 존재하지 않음. **결정: 기존 `getMeetingById`의 응답 DTO를 실 서버 스키마에 맞춰 확장**하고, 시간대 집계는 PR #72의 `toRankedSlots` 클라이언트 어댑터로 수행. 미구현된 `fetchVoteTimeSlotStat`은 본 작업에서 deprecation 주석 처리.
- Q: 결과 페이지 푸터의 `투표 수정하기 / 투표하기` 버튼은 어떻게 처리할까요? → A: **둘 다 유지하고 onClick 연결.** `투표 수정하기` → `/meet/[meetingId]/edit`, `투표하기` → `/meet/[meetingId]/register`. 사용자 식별과 무관하게 두 진입점을 모두 노출.
- Q: `RankedSlot.badgeGroup` 필드는 어떻게 할까요? → A: **deprecation 주석으로 보존.** 출처 추적 결과 PR #68 data-model에서 정의되고 tasks T011에서 Badge variant 매핑 helper로 쓰일 예정이었으나, PR #72 구현 단계에서 RankChip 컴포넌트로 분리되며 `slot.rank` 숫자로 직접 분기하도록 우회되어 렌더 경로에서 떨어져 나간 데드 필드. 사용자 명시 제약에 따라 본 작업에서는 deprecation 주석만 추가하고, 실제 제거는 별도 정리 PR(TODO-9)로 이월. 색 매핑은 `RankChip`을 단일 출처로 둔다.
- Q: 결과 페이지 진입 시 기본 뷰는 무엇으로 할까요? → A: **`timeRange` 유무로 분기.** (1) `timeRange`가 있는 모임 → 히트맵 표가 기본, 토글로 카드뷰 전환 (현재 `MeetResultTablePage` 유지 + `VoteRankCardsPage` 결합). (2) `timeRange`가 없는 모임(생성 시 시간 미선택) → 시간대 슬롯이 없으므로 히트맵·카드 둘 다 의미 없음 → **기존 날짜 단위 달력뷰(투표 결과 캘린더)로 폴백.**

### Session 2026-05-07 (Analyze 단계)

- Q: FR-008/SC-005/SC-007 의 "제거" 표현이 사용자 명시 제약과 충돌. → A: **spec 정정.** "제거된다" → "deprecation 주석 표시 + 운영 호출 0개 검증." 실제 제거는 TODO-9.

### Session 2026-05-07 (Implement 단계 진입 시 reality 측량)

- Q: spec/plan/tasks 작성 동안 사용자가 본 브랜치에서 별도 commits를 진행. T019/T020 (badgeGroup deprecation 주석)이 이미 정반대 방향(badgeGroup을 single source로 통합)으로 처리됐고, T021 (isOpen deprecation 주석)이 이미 완전 제거로 처리됨. 어떻게 정합화? → A: **사용자 작업 우선 채택, spec 재정정.** 두 결정 모두 결과적으로 더 정합적: (a) `mapBadgeGroup → slot.badgeGroup → RankChip` 단일 데이터 흐름 (b) `isOpen` 완전 제거가 deprecation보다 깔끔. FR-008/FR-009/SC-005/SC-007 표현을 reality에 맞게 정정. T019/T020/T021/T028은 완료 마킹. 사용자 명시 제약("지금 지우지 말고 주석처리")은 _남은_ deprecation 대상(`fetchVoteTimeSlotStat`, `fetchVoteDateStat`, `buildMockSnapshot`, mock generators)에만 적용.
- Q: viewMode 타입이 commit [63f91bc](https://github.com/nomoney-w2/moit/commit/63f91bc)에서 `'calendar' → 'list'` 로 rename됨. spec/plan/tasks의 'cards' 표현은 어떻게? → A: 본 spec 문서에서는 의미 명확성 우선으로 "카드 뷰" 라는 한국어 표현 유지 가능. 코드 식별자는 `'list'` 사용 (구현 시 일관 사용).
- Q: SC-002 LCP 95p < 2초 검증 방법 모호. → A: **SC-002 삭제.** 성능 측정은 본 spec 외 별도 인프라 이슈로 분리.
- Q: FR-003/FR-004 로딩·오류 UI 구체. → A: **인-페이지 스켈레톤(`loading.tsx`) + 에러 컴포넌트(`error.tsx`).** 404는 `notFound()`, 5xx는 error.tsx 의 reset CTA.
- Q: timeRange-less 분기에서 ReactDatepicker 의 useState/useRef 상태 관리 위치. → A: **page.tsx 는 server 유지** + 신규 client wrapper 컴포넌트로 결합 분리. `generateMetadata` 의 SEO 동작 보존.
- Q: "과거 날짜" 의 경계 정의. → A: today **이전** (today 당일은 future 그룹). data-model.md §7 에 명시.
- Q: NFR-001 SEO 회귀 검증. → A: T013 에 메타 회귀 검증 sub-item 추가. 신규 SC-008 도 추가.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 시스템은 결과 페이지 진입 시 모임 ID로 `GET /api/v1/meeting?meetId=X` 한 번을 호출해 모임 메타·참여자 raw 투표(`voteTimeSlots`)·`timeRange`·`status`를 함께 받아야 한다. 별도 집계 엔드포인트 호출은 하지 않는다.
- **FR-002**: 시스템은 백엔드 응답을 `vote-rank-cards`가 소비하는 `MeetingVoteSnapshot`으로 변환하는 어댑터를 제공해야 한다. 현재 PR #72의 `MeetingVoteSnapshot` 형태가 응답 스키마와 사실상 동일하므로, 어댑터는 zod 검증 + 정렬·정규화만 수행한다.
- **FR-002a**: 프로젝트의 `meetResponseDto`(zod 스키마) 는 실 서버 응답(`participants[].voteTimeSlots`, `timeRange`, `status`, `finalizedDate?`) 을 모두 반영하도록 확장되어야 한다.
- **FR-002b**: 본 작업 종료 시점에 운영 코드 경로에서 사용되지 않게 되는 함수(`fetchVoteTimeSlotStat`, `fetchVoteDateStat`, `buildMockSnapshot` 등) 와 그에 종속된 보조 자산(mock 생성기·deprecated 타입 필드 등) 은 **deprecation 주석으로 보관**된다 (사용자 명시 제약). 실제 파일·심볼 제거는 별도 정리 PR(plan.md TODO-9)에서 진행한다.
- **FR-003**: 응답이 도착하기 전 사용자는 결과 페이지 영역에서 인-페이지 스켈레톤(`app/meet/[meetingId]/loading.tsx`) 을 보아야 하며, 깨진 레이아웃을 보아서는 안 된다. TopBar·푸터는 스켈레톤과 함께 즉시 노출된다.
- **FR-004**: 응답이 404 인 경우 시스템은 Next.js의 `notFound()` 를 호출해 표준 not-found 페이지를 노출한다. 5xx/네트워크 오류 인 경우 `app/meet/[meetingId]/error.tsx` 의 에러 컴포넌트가 사용자에게 상황 안내와 다시 시도 가능한 동작(reset 함수 호출) 을 제공한다.
- **FR-005**: 시스템은 결과 페이지에서 모임의 `timeRange` 유무에 따라 다음과 같이 분기해야 한다.
  - `timeRange`가 있는 모임: 결과 페이지에 두 개의 시간대 결과 뷰(히트맵 표 = 기본 / 순위 카드 리스트) 를 제공하고, 사용자가 토글 컨트롤로 전환할 수 있어야 한다.
  - `timeRange`가 없는 모임(생성 시 시간 미선택): 시간대 뷰는 노출하지 않고, 기존 날짜 단위 결과 캘린더 뷰로 렌더한다.
- **FR-006**: `/test/vote-rank-cards` 라우트는 본 작업 완료 후 그대로 유지하되, **운영 라우트** `/meet/[meetingId]`가 단일 진입점이 되어야 한다 (test 라우트는 개발용).
- **FR-007**: PR #72에서 추가된 mock 시드(`buildMockSnapshot`) 의 사용자 가시 노출은 본 작업 완료 시점에 종료되어야 한다 (실 API로 대체).
- **FR-008**: 색상 그루핑의 단일 진실 원천은 어댑터의 `mapBadgeGroup`이며, `RankedSlot.badgeGroup` 필드를 통해 UI에 전달된다. `RankChip`은 `badgeGroup` props를 받아 색을 결정한다 (자체 매핑 보유 X). **이미 commit [2edab5e](https://github.com/nomoney-w2/moit/commit/2edab5e)에서 통합 완료** — Analyze 단계의 deprecation 결정은 사용자가 더 정합적인 방향(single source 살리기)으로 처리하여 재정정됨.
- **FR-009**: `useVoteRankCardToggle.isOpen` 콜백은 호출자가 0개임이 확인되어 본 작업에서 완전 제거된다. **이미 commit [351104d](https://github.com/nomoney-w2/moit/commit/351104d)에서 제거 완료** — Analyze 단계의 deprecation 결정은 사용자가 한 단계 진전시켜(완전 삭제) 재정정됨.
- **FR-010**: 푸터의 `투표 수정하기` / `투표하기` CTA는 둘 다 노출되며, 각각 `/meet/[meetingId]/edit` / `/meet/[meetingId]/register` 라우트로 이동해야 한다.
- **FR-011**: `rankSlots`의 과거 날짜 보조정렬 동작은 단위 테스트로 보장되어야 한다 ("과거"의 정의: today 이전 날짜 — today 당일은 future 그룹. data-model.md §7 주석 참조).
- **FR-012**: `app/meet/[meetingId]/page.tsx` 는 server component 로 유지되어 `generateMetadata` 의 SEO/오픈그래프 동작을 보장한다. 클라이언트 상태가 필요한 결합부(timeRange-less 분기의 캘린더 인터랙션 등) 는 별도 client wrapper 컴포넌트로 분리한다.

### Non-Functional Requirements

- **NFR-001**: 결과 페이지 초기 렌더는 SEO/오픈그래프 메타에 영향을 주지 않아야 한다 (현재 `generateMetadata`는 `getMeetingById` 사용 중).
- **NFR-002**: API 응답 검증은 zod 스키마로 일관 수행한다 (`shared/api/validate.ts` 패턴).
- **NFR-003**: 어댑터 변환은 순수 함수로 격리되어 단위 테스트로 검증 가능해야 한다.

### Key Entities

- **Meeting (모임)**: 호스트가 만든 일정 조율 단위. `id, title, dates, hostName, status, timeRange?, maxParticipantCount, participants[]` — 본 spec에서 timeRange의 응답 위치 결정 필요.
- **TimeSlotCell (시간대 셀)**: 한 (날짜, slotIdx) 조합의 집계. `count, participants[]` (가능자 명단). 백엔드 표현.
- **RankedSlot (순위 슬롯)**: 카드 1장이 표시하는 단위. `rank, canPeople, cannotPeople, startTime, endTime` 등. PR #72에서 정의 완료, 본 spec에서 재사용.
- **MeetingVoteSnapshot**: PR #72의 입력 모델. 실 API 도입 시 그대로 유지할지/슬림 ViewModel로 교체할지 본 spec의 결정 사항.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 결과 페이지에서 보이는 카드의 가능자 수·명단이 백엔드 집계와 100% 일치한다 (동일 데이터 기준 mock과의 차이가 0).
- **SC-003**: 404 시 표준 not-found 페이지, 5xx/네트워크 오류 시 error.tsx 의 "다시 시도" 가능한 안내 화면이 100% 케이스에서 노출된다 (깨진 빈 레이아웃 노출률 0).
- **SC-004**: PR #72의 `buildMockSnapshot` 호출이 운영 코드 경로에서 0회가 된다.
- **SC-005**: 색 매핑이 `mapBadgeGroup` (어댑터) → `slot.badgeGroup` → `RankChip` 단일 데이터 흐름으로 통합되고, `RankChip` 내부에 자체 색 룩업 테이블이 없음이 확인된다 ([2edab5e](https://github.com/nomoney-w2/moit/commit/2edab5e)).
- **SC-006**: `rankSlots`의 과거 날짜 보조정렬을 검증하는 테스트 케이스가 1개 이상 추가된다 ([300a7e2](https://github.com/nomoney-w2/moit/commit/300a7e2)).
- **SC-007**: `useVoteRankCardToggle`의 반환 시그니처에 `isOpen`이 더 이상 존재하지 않음이 type system으로 보장된다 ([351104d](https://github.com/nomoney-w2/moit/commit/351104d)).
- **SC-008**: `app/meet/[meetingId]/page.tsx` 가 server component 로 유지되어 `generateMetadata` 가 정상 동작함이 view-source 로 확인된다 (og:title, og:description 노출).

---

## Assumptions

- 백엔드는 시간대별 집계를 서버에서 미리 계산해 내려주는 `voteTimeSlotStatDto` 형태(또는 동등) 를 제공할 것이다 — 클라가 모든 참여자 raw vote를 받아 집계하지 않는다.
- `timeRange`(시작·종료 시각, slotCount) 는 모임 메타의 일부로 응답에 포함될 것이다. 현재 `meetResponseDto`에는 누락이라 추가 또는 별도 응답 결합이 필요하다.
- `MeetResponse.participants[].voteDates`는 날짜 단위만 표현하며, 시간대 단위 가능 여부는 별도 시간대 집계 API를 통해서만 확보 가능하다.
- PR #71 (관련 의존) 머지 이후 본 작업이 시작된다고 가정한다.
- 토글의 기본 뷰는 히트맵 표 (Clarifications 결정).

---

## Out of Scope

- 카드 리스트 자체의 정렬 알고리즘 변경 (PR #72에서 확정).
- 새로운 결과 시각화 추가 (3번째 뷰, 차트 등).
- 모임 종료/확정(`finalizedDate` 처리) 플로우 — SERVICE_OVERVIEW에 따르면 MVP 범위 외.
- 위치 선택/투표 마감 등 미래 기능.
- 실시간 동기화(WebSocket 등) — 새로고침으로만 갱신.

---

## Dependencies

- **PR #71** (의존, 머지 대기): 머지 후 본 작업 시작.
- **PR #72** (선행 머지 필요): vote-rank-cards 컴포넌트·어댑터의 베이스.
- **백엔드 API** (`GET /api/v1/meeting?meetId=X`): 응답 스키마는 sandbox swagger 기준 확인 완료. 운영 환경 동일 여부는 별도 확인 필요.

---

## TODO / 추적 포인트 _(본 spec 범위 밖이지만 기억해 둘 것)_

화면 플로우 정리 중 도출된 항목들. 본 작업에서 처리하지 않더라도 이후 작업·리뷰 시 놓치지 않도록 명시한다.

### TODO-1. `/[meetingId]` 루트 라우트가 stub 상태

- **현황**: [src/app/\[meetingId\]/page.tsx](../../../src/app/[meetingId]/page.tsx) 가 "모임 ID: xxx" 텍스트만 출력하는 placeholder.
- **이슈**: `docs/moit/SERVICE_OVERVIEW.md`는 `/[meetingId]`를 메인 모임 페이지로 명시하지만, 실 코드는 `/meet/[meetingId]`만 사용 중. 라우트 의도와 구현이 어긋남.
- **결정 보류 사유**: 본 spec은 결과 페이지(`/meet/[meetingId]`) 에 집중하므로 범위 밖.
- **후속 액션**: 루트 stub을 (a) 제거할지, (b) `/meet/[meetingId]`로 redirect할지, (c) SERVICE_OVERVIEW를 코드에 맞게 갱신할지 별도 이슈로 결정.

### TODO-2. 0표 빈 상태에서 푸터 `투표 수정하기` 버튼 활성도

- **현황**: 결과 페이지가 빈 상태(`아직 투표한 사람이 없어요`) 일 때도 푸터의 `투표 수정하기` / `투표하기` 두 버튼이 모두 노출되도록 결정(Clarifications).
- **이슈**: 0표 상태에서 `투표 수정하기` 진입 시 `/meet/[id]/edit`의 isExist 체크에서 항상 false로 떨어져 사용자가 막다른 길을 마주할 수 있음.
- **후속 액션**: 디자인과 함께 (a) 0표 상태에서 `투표 수정하기` dim/disable, (b) 진입 후 친절한 빈 상태 안내, (c) 그대로 두고 isExist false 분기를 명확화 중 결정. 본 spec 구현 후 사용 검증해 결정.

### TODO-3. `?trigger=share` 쿼리 동작 명세

- **현황**: 호스트가 모임 생성 직후 `/meet/{id}?trigger=share`로 진입 ([useDateSelect.ts:90](../../../src/features/meet-create-date/model/useDateSelect.ts#L90)).
- **이슈**: 본 spec 작업 시 결과 페이지를 재구성하면서 이 쿼리 트리거가 의도대로 동작하는지 회귀 검증 필요. 공유 모달 노출 로직이 vote-rank-cards 결합으로 깨지지 않도록 확인.
- **후속 액션**: plan 단계에서 결과 페이지 컴포넌트 트리를 잡을 때 `?trigger=share` 처리 위치를 명시.

### TODO-4. 토글 선택 영속화 미지원에 따른 사용자 피드백 모니터링

- **현황**: 새로고침 시 기본 뷰(표) 로 복귀(Clarifications). localStorage 영속화 의도적 비포함.
- **후속 액션**: 출시 후 "내가 보던 뷰가 안 나온다"는 피드백이 누적되면 localStorage 1줄 추가로 해소 가능. 사전에 메트릭/피드백 채널 통해 모니터링.

### TODO-5. 결과 페이지 데이터 갱신 정책 가시화

- **현황**: 다른 참여자가 투표를 추가/수정해도 자동 갱신 안 됨. 새로고침해야 반영(Out of Scope).
- **이슈**: 사용자가 "왜 내 친구가 투표했다고 했는데 안 보이지?" 라는 혼동을 가질 수 있음.
- **후속 액션**: (a) 페이지 진입 시 항상 최신 fetch (현재 `getMeetingById`가 server component에서 호출되므로 새로고침 시 최신), (b) 명시적 "새로고침" 버튼 노출, (c) 스냅샷 시각 표시 중 디자인과 함께 결정. 본 spec은 기본 fetch만 보장.

### TODO-6. `voteTimeSlotStat` 엔티티 폴더 정리

- **현황**: `src/entities/voteTimeSlotStat/` 의 `api/fetchVoteTimeSlotStat.ts`가 throw 미구현 상태이며, Swagger 확인 결과 서버에 해당 엔드포인트가 존재하지 않음.
- **후속 액션**: 본 spec 구현 단계에서 다음 중 결정: (a) `voteTimeSlotStat` 엔티티 폴더 전체 삭제, (b) `dto`/`lib` (mock 생성기·heatmap intensity) 만 보존하고 `api/`만 제거. `MeetResultTablePage`가 `dto/lib`를 의존하는지 확인 후 처리.
