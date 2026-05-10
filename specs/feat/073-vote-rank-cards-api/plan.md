# Implementation Plan: vote-rank-cards API 연동 및 잔여작업 통합

**Branch**: `feat/#73-vote-rank-cards-api` | **Date**: 2026-05-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/feat/073-vote-rank-cards-api/spec.md`

## Summary

`vote-rank-cards` 와 `meet-result-table` 컴포넌트는 이미 결합돼 있으나(`MeetResultTablePage`가 토글로 두 뷰를 모두 렌더), 실 페이지 진입점인 `app/meet/[meetingId]/page.tsx`가 **mock 시드 기반 `buildMockSnapshot`/`generateMockVoteTimeSlotStat`** 으로 동작 중이다. 본 작업은 (1) `getMeetingById` 응답 DTO를 sandbox swagger 실 스키마(`participants[].voteTimeSlots`, `timeRange`, `status`, `finalizedDate`) 에 맞춰 확장하고, (2) `MeetResponse → MeetingVoteSnapshot` 어댑터를 entities 계층에 추가하며, (3) `timeRange` 유무에 따라 결과 페이지를 시간대 뷰(현행 토글) 또는 날짜 캘린더 뷰로 분기시키고, (4) PR #72 리뷰의 follow-up 정리를 **삭제 없이 deprecation 주석**으로만 표기한다.

사용자 명시 제약: **미사용 파일·더미 데이터는 본 작업에서 제거하지 않고 deprecation 주석으로 표기만 한다**. 향후 별도 정리 PR에서 실제 삭제.

## Technical Context

| 항목                  | 값                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------- |
| **Language/Version**  | TypeScript 5                                                                           |
| **Framework**         | Next.js 16 (App Router), React 19                                                      |
| **Styling**           | Tailwind CSS 4 + CVA + clsx + tailwind-merge                                           |
| **HTTP Client**       | ky (`shared/api/client.ts`)                                                            |
| **Validation**        | zod (`shared/api/validate.ts`의 `validateSchema`)                                      |
| **Date**              | date-fns 4.1, `shared/lib/date.ts`의 `parseDate` 헬퍼                                  |
| **State**             | React local state (server 상태는 server component fetch + Next 캐시)                   |
| **Testing**           | Vitest (lib 단위 테스트), Playwright (e2e — 본 작업 범위 밖)                           |
| **Storage**           | N/A — 클라 영속화 없음 (토글 선택 기억 안 함, Clarifications 결정)                     |
| **Target Platform**   | 모바일 웹 (max-w-screen-sm 컨테이너)                                                   |
| **Project Type**      | single (단일 Next.js 앱, `src/`)                                                       |
| **Performance Goals** | 결과 페이지 LCP 95p < 2초 (SC-002)                                                     |
| **Constraints**       | 백엔드 API 호출 1회(`GET /api/v1/meeting`)로 모든 결과 데이터 확보                     |
| **Scope**             | 1 신규 페이지 분기 + 1 신규 어댑터 + 1 DTO 확장 + 6개 deprecation 주석 + 1 테스트 추가 |

## Constitution Check

| 게이트                                | 상태              | 비고                                                                                                                                          |
| ------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. FSD 레이어 의존 방향**           | ⚠️ 기존 위반 발견 | `features/meet-result-table` → `features/vote-rank-cards` import (현재 코드). 본 작업은 위반을 추가하지 않으나 해소도 하지 않음. TODO로 추적. |
| **II. Single `src/` 구조**            | ✅                | 모든 변경이 `src/` 하위.                                                                                                                      |
| **III. No barrel exports**            | ✅                | 모든 import는 구체 파일 경로 사용. 본 작업도 동일.                                                                                            |
| **IV. Unidirectional within feature** | ✅                | `lib → model → ui` 순서 유지.                                                                                                                 |
| **V. Code style**                     | ✅                | function declaration, camelCase 등 모두 준수.                                                                                                 |

### 위반 정당화

**Violation**: `features/meet-result-table` 가 `features/vote-rank-cards` 를 직접 import.

**Why Needed**: `meet-result-table`의 `MeetResultTablePage`가 토글로 두 뷰(표/카드)를 같은 페이지에 노출. PR #133 단계에서 이 결합이 이미 머지됨.

**Simpler Alternative**: `widgets/vote-result/` 에서 두 feature를 조립하는 게 정석. 본 spec 범위 밖이지만 TODO에 추적.

**TODO 추가 항목**: TODO-7 으로 plan에 등재 (아래 "Open Items" 참조).

## Codebase Exploration Findings

### 이미 구현된 것 (재사용)

- [`src/app/meet/[meetingId]/page.tsx`](../../../src/app/meet/[meetingId]/page.tsx) — `getMeetingById` server fetch, `ParticipantHeader`, `VoteActionButtons` 모두 결선.
- [`src/app/meet/[meetingId]/VoteActionButtons.tsx`](../../../src/app/meet/[meetingId]/VoteActionButtons.tsx) — `/edit`, `/register` Link + Amplitude 트래킹 완비. **FR-010은 사실상 이미 완료**.
- [`src/features/meet-result-table/ui/MeetResultTablePage.tsx`](../../../src/features/meet-result-table/ui/MeetResultTablePage.tsx) — 토글(`useViewMode`)로 표·카드 뷰 분기 + `vote-rank-cards` 결합 완료.
- [`src/features/vote-rank-cards/lib/toRankedSlots.ts`](../../../src/features/vote-rank-cards/lib/toRankedSlots.ts) — `MeetingVoteSnapshot → RankedListResult` 어댑터.
- [`src/features/vote-results-calendar/ui/VoteResultsShell.tsx`](../../../src/features/vote-results-calendar/ui/VoteResultsShell.tsx) — 날짜 단위 결과 뷰 (timeRange-less 폴백).
- [`src/shared/api/client.ts`](../../../src/shared/api/client.ts), [`shared/api/validate.ts`](../../../src/shared/api/validate.ts) — ky 클라이언트 + zod 검증 패턴.
- [`src/shared/lib/date.ts`](../../../src/shared/lib/date.ts) — `parseDate` 헬퍼.

### 채워야 할 격차

1. **`meetResponseDto` 스키마 부족** — `participants[].voteTimeSlots`, `timeRange`, `status`, `finalizedDate` 누락.
2. **mock 데이터 의존** — `buildMockSnapshot` (해시 기반 가짜 voteTimeSlots), `generateMockVoteTimeSlotStat` (해시 기반 셀 통계).
3. **timeRange 분기 없음** — 현재 timeRange 유무와 무관하게 `MeetResultTablePage`만 렌더.
4. **DTO ↔ ViewModel 어댑터** — `MeetResponse → MeetingVoteSnapshot` 변환 함수 부재.
5. **`VoteTimeSlotStat` 파생** — 서버 집계 엔드포인트 없으므로 클라에서 `participants[].voteTimeSlots` 로부터 셀 단위 집계를 만들어야 함.

### 기존 패턴 참고 (1-2 features)

- **`meet-result-table`**: `lib/`(순수 연산: `slotKey`, `computeHeatmapIntensity`, `timeSlotConstants`) + `model/`(`useViewMode`, `useSelectedCell`) + `ui/`(`MeetResultTablePage` 조립 + UI 컴포넌트).
- **`vote-rank-cards`**: 동일 패턴.
- **API 호출 패턴** ([`getMeetingById.ts`](../../../src/entities/meet/api/getMeetingById.ts)):
  ```ts
  const rawResponse = await api
    .get(ENDPOINT, { searchParams: { meetId } })
    .json<unknown>();
  return validateSchema({
    dto: rawResponse,
    schema: meetResponseDto,
    schemaName: ENDPOINT,
  });
  ```

## Architecture Decisions

### AD-1. `MeetingVoteSnapshot` 타입 위치

- **현행**: `src/features/vote-rank-cards/lib/types.ts`
- **이슈**: `meet-result-table`이 이를 import → feature → feature 의존 (FSD 위반).
- **고려한 옵션**:
  - (a) `entities/meet/dto/meet.dto.ts`로 이전
  - (b) `shared/types/`로 이전
  - (c) 본 spec에서는 그대로 두고 TODO만 추적
- **결정**: **(c) 그대로 두고 TODO 추적**. 이유: 본 spec은 데이터 파이프 연결이 핵심이고, 타입 이전은 기존 import 사이트(메인·테스트·스토리) 6+개 파일을 동시 수정하므로 별도 PR이 안전.
- **FSD 영향**: 위반 유지 (TODO-8).

### AD-2. `MeetResponse → MeetingVoteSnapshot` 어댑터 위치

- **고려한 옵션**:
  - (a) `entities/meet/lib/toMeetingVoteSnapshot.ts`
  - (b) `features/vote-rank-cards/lib/toMeetingVoteSnapshot.ts`
  - (c) `features/meet-result-table/lib/toMeetingVoteSnapshot.ts`
- **결정**: **(a) `entities/meet/lib/toMeetingVoteSnapshot.ts`**. 이유: 두 features(`meet-result-table`, `vote-rank-cards`)가 모두 소비. entities 계층에 두면 features 양쪽이 의존해도 단방향 유지. 어댑터는 도메인 변환(서버 raw → 클라 ViewModel)이라 명사적이며 entities에 적합.
- **FSD 영향**: 합법.

### AD-3. `VoteTimeSlotStat` 파생 어댑터 위치

- **고려한 옵션**:
  - (a) `entities/voteTimeSlotStat/lib/buildVoteTimeSlotStat.ts` (mock 생성기 옆)
  - (b) `features/meet-result-table/lib/buildVoteTimeSlotStat.ts`
- **결정**: **(a)**. 이유: mock 생성기와 동일 산출물 모양을 만드는 함수. entities에 두고 `MeetResponse`를 받아 `VoteTimeSlotStat`을 만들어내는 표준 어댑터로 명세.
- **FSD 영향**: 합법.

### AD-4. timeRange-less 모임 분기 위치

- **고려한 옵션**:
  - (a) `app/meet/[meetingId]/page.tsx` 에서 if 분기
  - (b) `features/meet-result-table` 안에서 자체 분기
  - (c) 별도 widgets 생성
- **결정**: **(a) page.tsx 에서 if 분기**. 이유: page는 "라우팅 + 조립" 책임. timeRange 유무는 라우팅·뷰 선택 결정이므로 page가 가장 적절. 두 widget(`MeetResultTablePage`, `VoteResultsShell`) 중 하나를 props로 골라 마운트.
- **FSD 영향**: 합법.

### AD-5. timeRange-less 모임의 데이터 소스

- **현행**: `fetchVoteDateStat`가 throw 미구현 상태.
- **고려한 옵션**:
  - (a) `fetchVoteDateStat` 실제 구현 (별도 엔드포인트 가정)
  - (b) `MeetResponse.participants[].voteDates` 로부터 클라에서 집계 (서버 raw 사용)
- **결정**: **(b) 클라 집계**. 이유: Swagger 확인 결과 별도 엔드포인트 없음. timeRange-less 모임도 이미 `getMeetingById`로 받은 raw 데이터에서 충분히 도출 가능. `fetchVoteDateStat`는 deprecation 주석 후 보존.
- **FSD 영향**: 새 파일 `entities/voteDateStat/lib/buildVoteDateStat.ts` 신설.

### AD-6. Deprecation 정책 (사용자 명시 제약 반영)

- **결정**: 모든 미사용·교체 대상 파일/심볼은 **삭제하지 않고** 다음 형식의 주석을 추가:
  ```ts
  /**
   * @deprecated [#73, 2026-05-07] {짧은 사유}.
   * Replacement: {대체 경로}
   * Removal target: 별도 정리 PR (TODO-9 참조).
   */
  ```
- 적용 대상은 Phase 1 산출물(아래) 의 "Deprecation 표시 대상" 표 참조.

### AD-7. page.tsx Server/Client 분리 + 로딩·에러 처리 (Analyze 단계 결정)

- **결정**: `app/meet/[meetingId]/page.tsx` 는 **server component 로 유지**. `getMeetingById` 호출과 `generateMetadata` 가 서버에서 실행돼 SEO/오픈그래프 보존(FR-012, SC-008).
- **클라이언트 결합부 분리**:
  - timeRange 있는 모임: 기존 `MeetResultTablePage` (이미 client) 그대로 재사용.
  - timeRange 없는 모임: 신규 client wrapper `MeetResultCalendarClient.tsx` 를 `app/meet/[meetingId]/` 에 추가. props 는 `dateStats: VoteDateStat[]` 만 받고 내부에서 useState(`selectedDate`)·useRef(`calendarRef`) 로 `VoteResultsShell` + `ReactDatepicker` 조합 관리.
- **로딩**: `app/meet/[meetingId]/loading.tsx` 신규 추가. TopBar·푸터 자리 차지 + 본문 영역에 스켈레톤 카드 3개.
- **에러**:
  - `getMeetingById` 응답 status 404 → `try/catch` 후 `notFound()` 호출 (Next 표준).
  - 5xx/네트워크 → `try/catch` 없이 throw → `app/meet/[meetingId]/error.tsx` 가 처리. error.tsx 는 client component, `reset()` 함수 호출하는 "다시 시도" 버튼 노출.
- **wrapper 위치 옵션 검토**:
  - (a) `app/meet/[meetingId]/MeetResultCalendarClient.tsx` (page 옆)
  - (b) `features/vote-results-calendar/ui/VoteResultsCalendarPage.tsx`
- **결정**: **(a)** — 본 wrapper 는 `/meet/[meetingId]` 라우트 전용 결합 책임. features 로 옮기면 재사용 의도가 없음에도 의미를 부풀림. 동일 디렉토리의 기존 `ParticipantHeader.tsx`, `VoteActionButtons.tsx` 와 동일 컨벤션.
- **FSD 영향**: 합법. app 레이어가 client component 를 같은 폴더에 두는 것은 Next.js 표준 패턴이며 constitution I 의 "app: 라우팅 엔트리만" 원칙의 약한 위반이지만 라우트 전용 결합으로 정당화.

---

## Project Structure

### Documentation (this feature)

```text
specs/feat/073-vote-rank-cards-api/
├── spec.md              # 명세 (작성 완료)
├── plan.md              # 본 파일
├── research.md          # Phase 0 산출 (생성 대상)
├── data-model.md        # Phase 1 산출 (생성 대상)
├── contracts/           # Phase 1 산출 (생성 대상)
│   └── README.md
├── quickstart.md        # Phase 1 산출 (생성 대상)
├── checklists/
│   └── requirements.md  # 작성 완료
└── tasks.md             # /speckits/tasks 단계에서 생성
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── [meetingId]/
│   │   └── page.tsx                        # ⚠️ stub. TODO-1 참조 (본 작업 변경 없음)
│   ├── meet/[meetingId]/
│   │   ├── page.tsx                        # ✏️ server component 유지: API → 어댑터 → snapshot. timeRange 분기. notFound() 처리.
│   │   ├── loading.tsx                     # ➕ 신규: 인-페이지 스켈레톤
│   │   ├── error.tsx                       # ➕ 신규: 5xx·네트워크 오류 시 reset CTA
│   │   ├── MeetResultCalendarClient.tsx    # ➕ 신규 client wrapper: timeRange-less 분기 결합 (AD-7)
│   │   ├── ParticipantHeader.tsx           # 재사용 (변경 없음)
│   │   └── VoteActionButtons.tsx           # 재사용 (변경 없음)
│   └── test/vote-rank-cards/page.tsx       # 💬 deprecation 주석 (보존)
│
├── features/
│   ├── meet-result-table/                  # 재사용 (변경 없음, 내부 구조)
│   │   ├── ui/MeetResultTablePage.tsx
│   │   ├── ui/ResultTableView.tsx
│   │   ├── ui/HeatmapGrid.tsx
│   │   └── ...
│   ├── vote-results-calendar/              # 재사용 (timeRange-less 폴백)
│   │   └── ui/VoteResultsShell.tsx
│   └── vote-rank-cards/
│       ├── lib/types.ts                    # 💬 RankedSlot.badgeGroup 필드, RankBadgeGroup 타입에 deprecation 주석
│       ├── lib/toRankedSlots.ts            # 💬 mapBadgeGroup 함수에 deprecation 주석
│       ├── lib/toRankedSlots.test.ts       # 변경 없음 (테스트는 보존)
│       ├── lib/rankSlots.test.ts           # ✏️ 과거 날짜 보조정렬 테스트 1케이스 추가 (FR-011)
│       ├── lib/mock.ts                     # 💬 deprecation 주석 (test 라우트 전용으로 사용)
│       ├── model/useVoteRankCardToggle.ts  # 💬 isOpen 콜백에 deprecation 주석
│       └── ui/VoteRankCardsPage.tsx        # 💬 deprecation 주석 (test 라우트 전용)
│
├── entities/
│   ├── meet/
│   │   ├── dto/meet.dto.ts                 # ✏️ participantDto에 voteTimeSlots, meetResponseDto에 timeRange/status/finalizedDate 추가
│   │   ├── api/getMeetingById.ts           # 변경 없음 (스키마만 확장)
│   │   └── lib/                            # ➕ 신규 디렉토리
│   │       └── toMeetingVoteSnapshot.ts    # ➕ 신규: MeetResponse → MeetingVoteSnapshot
│   ├── voteTimeSlotStat/
│   │   ├── api/fetchVoteTimeSlotStat.ts    # 💬 deprecation 주석 (서버 엔드포인트 부재)
│   │   ├── dto/voteTimeSlotStat.dto.ts     # 재사용 (변경 없음)
│   │   └── lib/
│   │       ├── mock.ts                     # 💬 generateMockVoteTimeSlotStat 에 deprecation 주석
│   │       └── buildVoteTimeSlotStat.ts    # ➕ 신규: MeetResponse → VoteTimeSlotStat
│   └── voteDateStat/
│       ├── api/fetchVoteDateStat.ts        # 💬 deprecation 주석 (서버 엔드포인트 부재)
│       ├── dto/voteDateStat.dto.ts         # 재사용 (변경 없음)
│       └── lib/
│           └── buildVoteDateStat.ts        # ➕ 신규: MeetResponse → VoteDateStat[]
│
└── shared/                                 # 변경 없음 (validateSchema, parseDate 등 재사용)
```

**Structure Decision**: single Next.js app under `src/`, FSD layered. 본 spec은 다음으로 구성:

- 6개 신규 파일: 3개 어댑터(`entities/meet/lib/toMeetingVoteSnapshot.ts`, `entities/voteTimeSlotStat/lib/buildVoteTimeSlotStat.ts`, `entities/voteDateStat/lib/buildVoteDateStat.ts`) + 3개 라우트 보조(`app/meet/[meetingId]/loading.tsx`, `error.tsx`, `MeetResultCalendarClient.tsx`)
- 1개 DTO 확장 (`entities/meet/dto/meet.dto.ts`)
- 1개 page.tsx 변경 (server 유지 + 어댑터 결합 + timeRange 분기 + notFound)
- 9개 deprecation 주석 (Phase 1 산출물 표 참조)
- 1개 테스트 추가 (`rankSlots.test.ts` 과거 날짜 케이스)

---

## Phase 0 — Outline & Research

산출: [research.md](./research.md) (생성 예정)

### 조사 항목

#### R-1. swagger 응답 스키마 정확 매핑

- **Question**: `GET /api/v1/meeting?meetId=X` 의 정확한 JSON 응답 (특히 `timeRange.slotCount`, `participants[].voteTimeSlots` 의 nullable 여부, `finalizedDate` 포맷).
- **Approach**: sandbox swagger UI에서 실 응답 샘플 확인 또는 ParticipantResponse·MeetingResponse 스키마 다운로드.
- **Output**: `research.md §R-1` 에 zod 스키마 후보 + 각 필드 nullable·optional 결정.

#### R-2. timeRange 없는 모임의 응답 형태

- **Question**: 시간 범위를 선택 안 한 모임의 응답에서 `timeRange`가 (a) 필드 자체 누락 / (b) `null` / (c) `undefined` 중 어느 쪽인지.
- **Approach**: swagger 스키마의 optionality + sandbox 실 호출.
- **Output**: zod 스키마의 `.optional()` / `.nullable()` 결정. timeRange 분기 조건문 작성 기준.

#### R-3. `voteTimeSlots` 의 차원 보장

- **Question**: timeRange 없는 모임에서도 `participants[].voteTimeSlots` 가 빈 배열로 오는지 / 누락되는지.
- **Approach**: swagger 스키마 + 실 호출.
- **Output**: 어댑터에서 빈 배열 fallback 처리 정책.

#### R-4. parseISO vs parseDate 일관성 정책

- **Decision**: PR #72 코드리뷰에서 `parseISO`도 date-fns 4.1에선 로컬 자정으로 동작 확인됨(회귀 없음). 다만 프로젝트 컨벤션상 `parseDate` 일원화 권장.
- **Output**: 본 spec 신규 파일은 `parseDate` 사용. 기존 `parseISO` 유지 (style nit, 별도 PR로 정리).

#### R-5. 토글 영속화 미사용 결정 재확인

- **Decision**: Clarifications 결정 — `useViewMode('table')` 초기값으로 새로고침 시 표 뷰 복귀. 영속화 코드 추가 안 함.

---

## Phase 1 — Design & Contracts

산출:

- [data-model.md](./data-model.md) — 확장된 `meetResponseDto`, `MeetingVoteSnapshot` 매핑 규칙
- [contracts/README.md](./contracts/README.md) — `GET /api/v1/meeting` 계약 (sandbox swagger 인용)
- [quickstart.md](./quickstart.md) — 개발자 검증 시나리오

### 데이터 모델 변경 (요약)

#### `entities/meet/dto/meet.dto.ts`

```ts
// 신규 timeRangeDto는 이미 존재 → meetResponseDto에 포함
// 신규 participantDto 확장:
export const participantDto = z.object({
  id: z.number(),
  name: z.string(),
  voteDates: z.array(z.string()),
  voteTimeSlots: z.array(z.array(z.boolean())), // ➕ 추가
  hasVoted: z.boolean(),
});

// meetResponseDto 확장:
export const meetResponseDto = z.object({
  id: z.string(),
  title: z.string(),
  dates: z.array(z.string()),
  status: z.enum(['VOTING', 'FINALIZED', 'CLOSED']), // ➕ 추가
  finalizedDate: z.string().nullable().optional(), // ➕ 추가
  maxParticipantCount: z.number().nullable(),
  participants: z.array(participantDto),
  hostName: z.string(),
  timeRange: z
    .object({
      // ➕ 추가
      startTime: z.string().regex(TIME_PATTERN),
      endTime: z.string().regex(TIME_PATTERN),
      slotCount: z.number().int().min(1),
    })
    .nullable()
    .optional(),
});
```

#### 어댑터 시그니처

```ts
// entities/meet/lib/toMeetingVoteSnapshot.ts
export function toMeetingVoteSnapshot(meet: MeetResponse): MeetingVoteSnapshot;

// entities/voteTimeSlotStat/lib/buildVoteTimeSlotStat.ts
export function buildVoteTimeSlotStat(meet: MeetResponse): VoteTimeSlotStat;

// entities/voteDateStat/lib/buildVoteDateStat.ts
export function buildVoteDateStat(meet: MeetResponse): VoteDateStat[];
```

#### page.tsx 분기 의사 코드

```tsx
const meetingData = await getMeetingById(meetingId);
const snapshot = toMeetingVoteSnapshot(meetingData);

return (
  <main>
    <ParticipantHeader ... />
    {meetingData.timeRange ? (
      <MeetResultTablePage
        slotStat={buildVoteTimeSlotStat(meetingData)}
        snapshot={snapshot}
      />
    ) : (
      <VoteResultsShell ...>
        <ReactDatepicker stats={buildVoteDateStat(meetingData)} ... />
      </VoteResultsShell>
    )}
    <VoteActionButtons meetingId={meetingId} />
  </main>
);
```

### Deprecation 표시 대상 (사용자 명시 제약)

| 대상                                    | 위치                                                         | 사유                                                     | Replacement                          |
| --------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------ |
| `RankedSlot.badgeGroup`                 | `features/vote-rank-cards/lib/types.ts:52`                   | UI에서 미소비, slot.rank 숫자로 대체                     | `RankChip`이 `slot.rank`로 직접 매핑 |
| `RankBadgeGroup` 타입                   | `features/vote-rank-cards/lib/types.ts:35`                   | 위 필드 부속                                             | (제거 예정, TODO-9)                  |
| `mapBadgeGroup` 함수                    | `features/vote-rank-cards/lib/toRankedSlots.ts:48`           | 위 필드 부속                                             | (제거 예정, TODO-9)                  |
| `useVoteRankCardToggle.isOpen`          | `features/vote-rank-cards/model/useVoteRankCardToggle.ts:25` | 호출자 0개                                               | `openIds.has(id)` 직접 호출          |
| `vote-rank-cards/lib/mock.ts` 전부      | 동일 경로                                                    | 운영 라우트 mock 의존성 제거 후 test 라우트 외 사용 없음 | (test 라우트가 사라지면 함께 제거)   |
| `VoteRankCardsPage`                     | `features/vote-rank-cards/ui/VoteRankCardsPage.tsx`          | 운영은 `MeetResultTablePage` 사용                        | `MeetResultTablePage`                |
| `app/test/vote-rank-cards/page.tsx`     | 동일 경로                                                    | 운영 라우트 결합 후 시각 검증은 storybook으로 충분       | storybook stories                    |
| `buildMockSnapshot`                     | `app/meet/[meetingId]/page.tsx:87`                           | API 어댑터로 대체                                        | `toMeetingVoteSnapshot`              |
| `generateMockVoteTimeSlotStat` 호출처   | `app/meet/[meetingId]/page.tsx:125`                          | API 어댑터로 대체                                        | `buildVoteTimeSlotStat`              |
| `entities/voteTimeSlotStat/lib/mock.ts` | 동일 경로 (생성기 자체)                                      | 위 호출처 deprecation 후 운영 사용 0                     | (제거 예정, TODO-9)                  |
| `fetchVoteTimeSlotStat`                 | `entities/voteTimeSlotStat/api/fetchVoteTimeSlotStat.ts`     | 서버 엔드포인트 부재 (Swagger 확인)                      | `buildVoteTimeSlotStat` (클라 집계)  |
| `fetchVoteDateStat`                     | `entities/voteDateStat/api/fetchVoteDateStat.ts`             | 서버 엔드포인트 부재                                     | `buildVoteDateStat` (클라 집계)      |

---

## Open Items / Carry-over TODOs (spec의 TODO 섹션과 plan-only 추가)

본 plan 단계에서 식별된 이월 항목 (spec.md TODO 섹션과 통합·확장):

### TODO-7. (신규) `meet-result-table` 의 `vote-rank-cards` import — FSD 위반

- **Location**: [`src/features/meet-result-table/ui/MeetResultTablePage.tsx`](../../../src/features/meet-result-table/ui/MeetResultTablePage.tsx) 6-10행.
- **Action**: 두 feature를 조립하는 widget(`widgets/vote-result/ui/VoteResultDataView.tsx`) 으로 추출하거나 `MeetingVoteSnapshot` 타입을 `entities/meet/dto/`로 이전해 import 방향을 합법화.
- **Defer reason**: 본 spec은 데이터 파이프 연결 우선. 위반 추가 없음.

### TODO-8. (신규) `MeetingVoteSnapshot` 타입 위치 이전

- **Current**: `features/vote-rank-cards/lib/types.ts`
- **Target**: `entities/meet/dto/` 또는 `shared/types/`
- **Defer reason**: 6+ import 사이트 동시 변경 필요. 별도 PR.

### TODO-9. (신규) Deprecation 일괄 정리 PR

- **Scope**: 위 "Deprecation 표시 대상" 12개 + spec.md TODO-6 항목.
- **Trigger**: 본 spec 머지 후 1~2주 안정화 기간을 거쳐 별도 cleanup PR로 일괄 제거.

---

## Phase 2 (NOT in this command — `/speckits/tasks`로 진행)

본 plan 종료 후 `/speckits/tasks` 가 다음 task 들을 생성하게 될 것:

- T-1: `meetResponseDto` zod 스키마 확장 + 기존 사용처 type 호환성 확인
- T-2: `entities/meet/lib/toMeetingVoteSnapshot.ts` 신규 + 단위 테스트
- T-3: `entities/voteTimeSlotStat/lib/buildVoteTimeSlotStat.ts` 신규 + 단위 테스트
- T-4: `entities/voteDateStat/lib/buildVoteDateStat.ts` 신규 + 단위 테스트
- T-5: `app/meet/[meetingId]/page.tsx` 어댑터 결합 + timeRange 분기
- T-6~11: 6개 deprecation 주석 추가
- T-12: `rankSlots.test.ts` 과거 날짜 보조정렬 테스트 추가
- T-13: 운영 모임 1건으로 e2e 시각 회귀 (수동) — quickstart.md 시나리오

## Complexity Tracking

| Violation                                                             | Why Needed                                                                                                                          | Simpler Alternative Rejected Because                                                                                                 |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `features/meet-result-table` → `features/vote-rank-cards` import 유지 | PR #133 단계에서 머지된 기존 결합. 본 spec은 데이터 파이프가 핵심이라 결합 구조 재배치 동시 진행 시 변경 면적 ≥ 6 파일로 회귀 위험. | widget 추출/타입 이전을 동시 진행 시 본 spec의 SC-001 (mock→실 데이터 일치) 검증과 무관한 회귀 가능성. TODO-7·8로 별도 PR 진행 약속. |
