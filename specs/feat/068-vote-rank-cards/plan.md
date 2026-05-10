# Implementation Plan: 투표 결과 순위 뱃지 & 아코디언 카드 리스트뷰

**Branch**: `feat/#68-vote-rank-cards` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/feat/068-vote-rank-cards/spec.md`

## Summary

투표 결과 화면(리스트뷰)에서 후보 시간 슬롯을 "가능한 인원 수" 내림차순으로 정렬한 아코디언 카드 리스트를 보여주고, 1~5위에만 색상 그룹별 뱃지(1위 단독 / 2~3위 / 4~5위)를 부여한다. 동률·전원 동률·0표·빈 상태 같은 엣지 케이스를 명시적으로 처리한다.

기술 접근: 카드 컴포넌트는 표시용 ViewModel(`RankedSlot[]`)만 소비하고, mock 입력 → ViewModel 변환은 별도 어댑터(`toRankedSlots`)에서 수행한다. 순위 산정 알고리즘은 단위 테스트 가능한 순수 함수(`rankSlots`)로 분리한다. 본 단계에서는 실 API 없이 `/test/vote-rank-cards` 페이지에서 fixture 기반으로 동작.

## Technical Context

**Language/Version**: TypeScript 5
**Primary Dependencies**: React 19, Next.js 16 (App Router), Tailwind CSS 4 + CVA + clsx + tailwind-merge, date-fns, ky(미사용 — 본 단계 mock), zod(미사용 — 본 단계 mock)
**Storage**: N/A (클라이언트 mock fixture)
**Testing**: Vitest (단위; `lib/rankSlots`, `lib/toRankedSlots`), Storybook 10 (시각 회귀; 카드/리스트 stories)
**Target Platform**: 웹 브라우저 (모바일 우선; 기존 모임 서비스와 동일)
**Project Type**: single Next.js app (`src/`)
**Performance Goals**: 30 슬롯 mock 기준 카드 리스트 1초 이내 렌더 (SC-003)
**Constraints**: 신규 런타임 의존성 추가 금지, 본 기능 외부 파일은 `src/shared/ui/Badge.tsx` variant 추가 외 변경 없음, 배럴 패턴 금지
**Scale/Scope**: 단일 test 페이지 + 1개 features 슬라이스 + 1개 기존 shared 컴포넌트 확장. 신규 파일 약 10~12개.

## Constitution Check

| 원칙                                                 | 적용 결과        | 비고                                                                                                                                                    |
| ---------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. FSD 레이어 (`app → features → entities → shared`) | ✅ 통과          | 본 기능은 `app/test/vote-rank-cards`, `features/vote-rank-cards`, `shared/ui/Badge` 만 사용. `entities` 의존 없음(현재 DTO 부재)                        |
| II. Monorepo Structure                               | ⚠️ 해당사항 없음 | 현재 레포는 단일 `src/` 구조. constitution은 `apps/moit, apps/weddin` 모노레포 구상이나 실제는 단일 앱. 본 기능은 기존 `src/` 구조 그대로 따름.         |
| III. No Barrel Exports                               | ✅ 통과          | 모든 import는 구체 파일 경로 사용 (`@/features/vote-rank-cards/ui/VoteRankCard` 등)                                                                     |
| IV. Unidirectional Dependencies                      | ✅ 통과          | `app → features → shared` 단방향. `features/vote-rank-cards` 내부도 `lib → model → ui` 방향 유지                                                        |
| V. Consistent Code Style                             | ✅ 통과          | function declaration, camelCase/PascalCase, `is/has` boolean, `handle` prefix, `use` prefix 준수. `'use client'` 카드 컴포넌트는 토글 상태 때문에 필요. |

**Gate**: 위반 사항 없음. Phase 0 진행 가능.

### Re-check (Phase 1 종료 후)

- 의존성 방향, 배럴 금지, function declaration 모두 유지됨을 컴포넌트 트리에서 확인. 기존 `src/shared/ui/Badge.tsx`만 variant 추가 형태로 수정(레이어 위반 아님).

## Project Structure

### Documentation (this feature)

```text
specs/feat/068-vote-rank-cards/
├── plan.md              # 이 파일
├── spec.md              # /speckits:specify 산출물
├── research.md          # Phase 0 산출물
├── data-model.md        # Phase 1 산출물
├── contracts/
│   └── README.md        # 본 단계: API 없음 명시
├── checklists/
│   └── requirements.md  # /speckits:specify 단계 산출물
└── tasks.md             # /speckits:tasks 단계에서 생성 (이번 plan에서는 생성 안 함)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── test/
│       └── vote-rank-cards/
│           └── page.tsx                       # NEW — 얇은 라우팅, fixture → 페이지 컴포넌트
├── features/
│   └── vote-rank-cards/                       # NEW
│       ├── ui/
│       │   ├── VoteRankCardsPage.tsx          # NEW — 조립 Page (헤더 + 리스트 + 빈 상태)
│       │   ├── VoteRankCardList.tsx           # NEW — 카드 리스트 (정렬된 RankedSlot[] 매핑)
│       │   ├── VoteRankCard.tsx               # NEW — 단일 아코디언 카드 (헤더 + 본문)
│       │   ├── VoteRankCardEmptyState.tsx     # NEW — 빈 상태 안내 문구
│       │   ├── VoteRankCard.stories.tsx       # NEW — 시각 회귀
│       │   └── VoteRankCardsPage.stories.tsx  # NEW — 시각 회귀
│       ├── model/
│       │   └── useVoteRankCardToggle.ts       # NEW — 다중 펼침 상태 훅
│       └── lib/
│           ├── types.ts                       # NEW — MeetingVoteSnapshot, RankedSlot 등
│           ├── rankSlots.ts                   # NEW — 순위 산정 순수 함수
│           ├── rankSlots.test.ts              # NEW — 단위 테스트 (Vitest)
│           ├── toRankedSlots.ts               # NEW — 어댑터 (Snapshot → RankedListResult)
│           ├── toRankedSlots.test.ts          # NEW — 단위 테스트 (Vitest)
│           └── mock.ts                        # NEW — fixture (정상/빈/전원 동률)
└── shared/
    └── ui/
        └── Badge.tsx                          # MODIFY — rank1~5 색상 그룹 variant 정비 (rank4, rank5 추가, 1·2-3·4-5 그룹별 색상 분리)
```

**Structure Decision**: 단일 Next.js 앱 `src/` 구조 위에 FSD 슬라이스 1개(`features/vote-rank-cards`)를 신설. 카드 컴포넌트는 `ui/`, 토글 훅은 `model/`, 순수 산정/어댑터/타입/mock은 `lib/`. 기존 `entities/meet`은 본 기능에서 사용하지 않으며(현재 DTO에 voteTimeSlots/timeRange 부재), 실제 API 연동 시 `entities` 확장은 별도 작업.

## Architecture Decision Table

| #    | Decision                | Options Considered                                                                               | Chosen  | Impact on FSD Structure                                                                                           |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------- |
| AD-1 | 카드 컴포넌트 입력 모델 | (a) raw `MeetingVoteSnapshot` 직접 소비 / (b) `RankedSlot[]` ViewModel 소비                      | **(b)** | `features/vote-rank-cards/lib/types.ts`에 ViewModel 정의, 컴포넌트는 `ui/`에 한정                                 |
| AD-2 | 순위 산정 위치          | (a) `entities/voteDateStat/lib`에 추가 / (b) `features/vote-rank-cards/lib`에 신규               | **(b)** | 시간 슬롯·색상 그룹은 표시 도메인이라 features가 적합. 기존 `entities/voteDateStat/lib/calculateRank.ts`는 미사용 |
| AD-3 | 아코디언 구현           | (a) Radix `react-accordion` / (b) `useDisclosure` 자체 토글 / (c) `<details>`                    | **(b)** | 다중 펼침 + 단순 UX. 신규 의존성 없음. `model/useVoteRankCardToggle.ts`에 캡슐화                                  |
| AD-4 | 뱃지 컴포넌트           | (a) 신규 `RankBadge` / (b) 기존 `shared/ui/Badge` variant 확장                                   | **(b)** | 도메인 비의존 → shared가 적합. variant `rank1`, `rank2-3`, `rank4-5` 정비/추가                                    |
| AD-5 | mock fixture 위치       | (a) `entities/voteDateStat/lib/mock.ts`에 합병 / (b) `features/vote-rank-cards/lib/mock.ts` 신규 | **(b)** | 본 기능 전용 데이터 형태(`MeetingVoteSnapshot`)이며 다른 기능에서 재사용 가능성 낮음                              |
| AD-6 | test 페이지 라우트      | (a) `/test/[name]` 동적 / (b) `/test/vote-rank-cards` 정적                                       | **(b)** | 기존 `/test/bottom-sheet` 패턴 일치                                                                               |
| AD-7 | 다중 펼침 상태 관리     | (a) 카드 내부 `useState` / (b) 페이지 레벨 `Set<TimeSlotId>`                                     | **(b)** | 향후 "전체 펼침/접기" 컨트롤 추가 여지를 남김. `useVoteRankCardToggle`에 캡슐화                                   |

## Phase 0 산출물

상세 결정 근거는 [research.md](./research.md) 참조. 핵심:

- 아코디언은 자체 토글 (Radix 미도입)
- Badge 확장 (rank1, rank2-3, rank4-5)
- 색상 토큰은 plan 종료 후 Figma 노드(3650-30335 / 3627-6468)에서 보정
- `rankSlots` 순수 함수 + `toRankedSlots` 어댑터 분리
- Vitest 단위 + Storybook 시각 회귀 / Playwright 미사용

## Phase 1 산출물

- [data-model.md](./data-model.md): `MeetingVoteSnapshot`, `RankedSlot`, `RankedListResult` 정의 + 어댑터 인터페이스
- [contracts/README.md](./contracts/README.md): 본 단계는 API 없음 명시 + 향후 placeholder

## Complexity Tracking

> 위반 사항 없음. 본 절은 비워둔다.

## 다음 단계

`/speckits:tasks` 실행하여 의존성 정렬된 작업 목록(`tasks.md`)을 생성한다.
