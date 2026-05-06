# Implementation Plan: 모임 테이블뷰 화면

**Branch**: `feat/#133-meet-table-view` | **Date**: 2026-04-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/feat/133-meet-table-view/spec.md`

## Summary

`/meet/{meetingId}` 결과 화면에 30분 단위 시간 슬롯 기반 투표 히트맵 테이블뷰를 기본 진입 화면으로 추가하고, 우상단 토글로 기존 캘린더뷰(`VoteResultDataView`)와 전환한다. 색상 농도는 가능 인원수 기준 상위 5개 슬롯에 1위 100% / 2위 70% / 3위 50% / 4위 30% / 5위 10%를 부여하고 그 외는 베이스 톤. 기존 `ParticipantHeader`(좌상단 캘린더+ / 중앙 모임 타이틀 / 우상단 공유)와 `VoteActionButtons`(하단 투표/수정 버튼)를 재사용한다. 시간 슬롯 데이터 모델·API는 별도 명세에 의존하므로 본 명세에서는 entity 스켈레톤 + mock 데이터로 표시 계층을 검증한다.

## Technical Context

**Language/Version**: TypeScript 5
**Primary Dependencies**: Next.js 16 (App Router), React 19, Tailwind CSS 4 (+ CVA + clsx + tailwind-merge), ky, zod, date-fns
**Storage**: N/A (서버 상태는 백엔드 API; 클라이언트는 React 상태만)
**Testing**: Vitest (단위) + Playwright (E2E)
**Target Platform**: 모바일 우선 웹(max-w-screen-sm), 데스크톱 보조
**Project Type**: Single Next.js app (apps 모노레포 분리는 아직 적용 전 — `src/` FSD 구조)
**Performance Goals**: 초기 그리드 렌더 1초 이내(SC-002), 가로 스크롤 60fps(SC-003), 토글 전환 200ms 이내(SC-004)
**Constraints**: 모바일 뷰포트(`min-h-screen-safe`), 가로+세로 스크롤 동시 지원, 좌측 시간 컬럼 sticky, 하단 버튼 fixed
**Scale/Scope**: 후보 날짜 1~수십개, 시간 슬롯 24개(9~21시 30분 단위), 셀 ≤ 24×수십 = 수백 단위

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Feature-Sliced Design (FSD)

- ✅ 새 feature `meet-result-table` (행동 단위 동사형)
- ✅ 새 entity `voteTimeSlotStat` (도메인 명사형, 기존 `voteDateStat` 패턴 mirror)
- ✅ 기존 widget `vote-result/ui/VoteResultDataView` 재사용 (토글 시 표시)
- ✅ 레이어: app → features → entities → shared 단방향
- ✅ feature 내부: lib → model → ui 단방향
- ✅ widget(`vote-result`) → feature/shared만 의존

### II. Monorepo Structure

- ⚠️ Constitution은 `apps/moit`을 명시하지만 현 저장소는 단일 `src/` 구조. **현재 코드베이스 상태를 따라** `src/...`에 작성 (모노레포 마이그레이션은 별도 의제)

### III. No Barrel Exports

- ✅ 모든 import는 개별 파일에서 직접 (`index.ts` 재export 금지)

### IV. Unidirectional Dependencies

- ✅ `entities/voteTimeSlotStat`은 `features/`/`widgets/`을 import하지 않음
- ✅ `features/meet-result-table`은 `entities`와 `shared`만 import
- ✅ `widgets/vote-result`는 그대로 유지 (이미 `entities`만 import)

### V. Consistent Code Style

- ✅ `function declaration`(`export default function MeetResultTablePage()`) 사용
- ✅ Boolean prefix(`is`/`has`), 핸들러 prefix(`handle`), 훅 prefix(`use`)
- ✅ 컴포넌트 PascalCase, 훅·유틸 camelCase, DTO `.dto.ts`
- ✅ 상수 UPPER_SNAKE_CASE

**Gate Status**: PASS (no violations to justify)

## Project Structure

### Documentation (this feature)

```text
specs/feat/133-meet-table-view/
├── plan.md              # This file
├── spec.md              # /speckits:specify output
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── fetchVoteTimeSlotStat.contract.md
└── checklists/
    └── requirements.md  # /speckits:specify output
```

### Source Code (repository root)

본 명세는 단일 Next.js 앱(`src/`) 구조의 FSD 레이어 위에 다음 파일을 생성·수정한다.

```text
src/
├── app/meet/[meetingId]/
│   ├── page.tsx                                # MODIFY: 데이터 페치 후 MeetResultTablePage로 위임 (얇게 유지)
│   ├── ParticipantHeader.tsx                   # KEEP: 그대로 재사용
│   └── VoteActionButtons.tsx                   # KEEP: 그대로 재사용
│
├── features/meet-result-table/                 # NEW: 행동 = "결과를 테이블/캘린더로 보여주기"
│   ├── ui/
│   │   ├── MeetResultTablePage.tsx             # NEW: 조립 페이지 (헤더/토글 영역/뷰 스위치/하단 버튼 영역 조립)
│   │   ├── ResultTableView.tsx                 # NEW: 테이블뷰 본체 (히트맵 그리드 + 카운트/토글 헤더)
│   │   ├── HeatmapGrid.tsx                     # NEW: 시간 컬럼 + 날짜 헤더 + 셀 배치, 스크롤·sticky 책임
│   │   ├── HeatmapCell.tsx                     # NEW: 단일 (날짜, 30분 슬롯) 셀 렌더 (농도 적용)
│   │   ├── ViewToggle.tsx                      # NEW: 우상단 table↔calendar 토글 스위치
│   │   └── ResultCountBar.tsx                  # NEW: "N명이 투표했어요" + ViewToggle 동일 영역
│   ├── model/
│   │   └── useViewMode.ts                      # NEW: 'table' | 'calendar' 상태 훅 (default: 'table')
│   └── lib/
│       ├── timeSlotConstants.ts                # NEW: START_HOUR=9, END_HOUR=21, SLOTS_PER_HOUR=2, OPACITY_TABLE
│       ├── computeHeatmapIntensity.ts          # NEW: slotCounts → Map<cellKey, opacityLevel> (순위·동률·컷오프 정책)
│       └── slotKey.ts                          # NEW: cellKey(date, slotIdx) 직렬화
│
├── entities/voteTimeSlotStat/                  # NEW: 도메인 = 시간 슬롯별 투표 통계
│   ├── dto/
│   │   └── voteTimeSlotStat.dto.ts             # NEW: zod 스키마 + 타입 (slot, availableCount, available[])
│   ├── api/
│   │   └── fetchVoteTimeSlotStat.ts            # NEW: 스텁 (throw 'not implemented yet'). voteDateStat 패턴 mirror
│   └── lib/
│       └── mock.ts                             # NEW: meetingId·후보 날짜 기반 결정론적 mock 생성기 (개발/Storybook용)
│
├── widgets/vote-result/ui/
│   └── VoteResultDataView.tsx                  # KEEP: 토글 캘린더뷰로 그대로 재사용
│
└── shared/
    └── ui/                                     # POSSIBLY EXTEND: ViewToggle용 시각 요소가 필요하면 shared에 추가 후보
                                                # 다만 이 토글은 도메인 의미(table/calendar)가 강해 features에 둠
```

**Structure Decision**: 신규 feature `meet-result-table`이 화면 조립을 담당하고, 기존 `widgets/vote-result/ui/VoteResultDataView`는 그대로 토글 시 표시. entity `voteTimeSlotStat`은 기존 `voteDateStat`의 미구현 패턴(스텁 + mock + dto)을 그대로 mirror하여, 데이터 모델 별도 명세가 완성되기 전까지 mock으로 화면을 검증.

## Architecture Decisions

| Decision                                             | Options Considered                                                                              | Chosen                                                                                         | Rationale                                                                                                                                                                                              | FSD Impact                                                                               |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **AD-001: 데이터 진입 위치**                         | (a) Server Component(page.tsx)에서 mock fetch (b) Client Component에서 mock fetch               | (a) page.tsx가 mock + 실 데이터 모두 진입점                                                    | 기존 `getMeetingById` 호출 위치(서버)와 동일 패턴 유지, 추후 실 API 도입 시 변경 최소화                                                                                                                | `app/meet/[meetingId]/page.tsx`가 `entities/voteTimeSlotStat`에서 직접 import(허용 방향) |
| **AD-002: 토글 상태 위치**                           | (a) URL 쿼리(`?view=table`) (b) Client 컴포넌트 useState (c) localStorage 영속화                | (b) Client useState(default `'table'`)                                                         | 명세에서 영속화는 Out of Scope. URL 쿼리는 sharable URL 의미 없음. 가장 단순한 (b)                                                                                                                     | `features/meet-result-table/model/useViewMode.ts`                                        |
| **AD-003: 농도 계산 위치**                           | (a) 서버에서 미리 계산 (b) 클라이언트 lib 순수 함수 (c) 백엔드 응답으로 받음                    | (b) `lib/computeHeatmapIntensity.ts` 순수 함수                                                 | 표시 계층 정책. 실 데이터 모델 변화에 종속되지 않도록 클라이언트에서 결정. 단위테스트 용이                                                                                                             | `features/meet-result-table/lib/`                                                        |
| **AD-004: ViewToggle 컴포넌트 위치**                 | (a) shared/ui (b) features/meet-result-table/ui                                                 | (b) feature 내부                                                                               | 토글 옵션이 도메인 의미(table/calendar)에 강하게 결합. shared로 빼면 일반화 비용 발생. 향후 재사용 케이스 등장 시 승격                                                                                 | `features/meet-result-table/ui/ViewToggle.tsx`                                           |
| **AD-005: 그리드 가로 스크롤 방식**                  | (a) `overflow-x-auto`로 자유 스크롤 (b) snap-scroll(scroll-snap) (c) `/tt`처럼 4일 페이지네이션 | (a) 자유 스크롤 + 첫 진입 시 우측 컷오프 단서                                                  | 명세 FR-017/FR-021. 페이지네이션은 명세에서 명시 거부. snap은 1열 단위 스냅 시 UX 어색                                                                                                                 | `features/meet-result-table/ui/HeatmapGrid.tsx`                                          |
| **AD-006: 시간 컬럼 sticky 방식**                    | (a) `position: sticky` 좌측 컬럼 (b) overflow 분리한 별도 컬럼 (c) 가상화                       | (a) `sticky left-0`로 좌측 시간 라벨 컬럼 고정                                                 | 표준 CSS 패턴, 접근성 우수, 셀 수 ≤ 수백이라 가상화 불요                                                                                                                                               | `features/meet-result-table/ui/HeatmapGrid.tsx`                                          |
| **AD-007: 날짜 헤더 sticky**                         | (a) sticky top (b) 그리드 외부 고정 헤더                                                        | (b) 그리드 위에 별도 헤더 행 (스크롤 영역과 분리)                                              | 페이지 상단 `ParticipantHeader`(fixed)와 `Header`(상단)가 이미 sticky/fixed라 추가 sticky 중첩은 z-index 복잡도 증가. 그리드는 세로 스크롤 영역으로 두고 헤더 행은 그리드 컨테이너 내부 sticky `top-0` | `features/meet-result-table/ui/HeatmapGrid.tsx`                                          |
| **AD-008: 셀 색상 표현**                             | (a) Tailwind opacity 변형 클래스 (b) 인라인 style의 backgroundColor + opacity (c) CSS 변수      | (a) primary 기반 opacity 5단계(`bg-[#3C7EFA]`, `/70`, `/50`, `/30`, `/10`, base)               | `/tt/page.tsx`의 농도 표현 패턴과 일관, Tailwind 4 임의값 호환, 단순                                                                                                                                   | `features/meet-result-table/ui/HeatmapCell.tsx`                                          |
| **AD-009: voteTimeSlotStat 데이터 형태**             | (a) 슬롯별 `availableCount`만 (b) 슬롯별 참여자 ID 리스트 (c) 참여자별 `availableSlots[]`       | (a) **동시에** (b) 둘 다 — `{ slot, count, participants[] }`                                   | 이번 명세는 `count`만 사용하지만, 참여자 리스트는 별도 명세 / 셀 탭 인터랙션(Out of Scope) 등에서 재사용 가능. mock에 둘 다 채워두면 추후 추가 비용 없음                                               | `entities/voteTimeSlotStat/dto/`                                                         |
| **AD-010: VoteResultDataView 재사용 시 데이터 매핑** | (a) 기존 props 형태 그대로 위임 (b) 시간 슬롯에서 날짜별 요약 재계산                            | (a) page.tsx에서 기존 `getStatsFromParticipants`로 계산한 결과를 그대로 prop으로 전달          | 명세 Assumption: 캘린더뷰 데이터 매핑은 별도 결정. 본 명세는 "기존 데이터를 그대로 재사용"                                                                                                             | `app/meet/[meetingId]/page.tsx` 내부에서 두 데이터 모두 준비                             |
| **AD-011: 헤더 컴포넌트 처리**                       | (a) 기존 `ParticipantHeader` 그대로 + 카운트/토글은 별도 행 (b) 새 통합 헤더 만듦               | (a) 분리 — 상단 ParticipantHeader는 그대로, 그 아래 ResultCountBar(count + toggle) 새 컴포넌트 | 기존 fixed 상단 ParticipantHeader 동작/공유 시트/캘린더+ 진입점 변경 비용 회피                                                                                                                         | 새 컴포넌트만 추가, 기존 컴포넌트 무수정                                                 |

## Phase 0 — Outline & Research

→ See [research.md](./research.md)

추출된 unknowns:

1. ~~시간 슬롯 데이터 모델~~ → 명세 Assumption으로 위임. 본 명세는 mock + 스텁 패턴 채택(voteDateStat mirror). research.md에서 명시.
2. ~~토글 상태 영속화~~ → 명세 Out of Scope. AD-002로 결정.
3. ~~키보드/스크린리더 접근성~~ → 명세 사용자 결정으로 plan에서 결정. research.md에서 결정.
4. ~~날짜 헤더 sticky 방식~~ → AD-007로 결정.

## Phase 1 — Design & Contracts

### Data Model

→ See [data-model.md](./data-model.md)

신규 entity:

- `voteTimeSlotStat` (`{ meetingId, slots: [{ date, slotIdx, count, participants[] }] }`)

기존 entity 재사용:

- `meet` (`getMeetingById` → MeetResponse) — `participants[].hasVoted`로 카운트 산출
- `voteDateStat` 패턴 — 스텁/mock 디자인을 mirror

### Contracts

→ See [contracts/fetchVoteTimeSlotStat.contract.md](./contracts/fetchVoteTimeSlotStat.contract.md)

API 함수:

- `fetchVoteTimeSlotStat({ meetingId }) → Promise<VoteTimeSlotStat>` (스텁; 실 API 정의는 별도 명세)

### Component Hierarchy

```
app/meet/[meetingId]/page.tsx               (Server Component)
├── ParticipantHeader (fixed top, KEEP)
└── MeetResultTablePage (Client; receives meetingData + slotData + stats)
    ├── ResultCountBar
    │   ├── "{N}명이 투표했어요" 텍스트
    │   └── ViewToggle (table ↔ calendar)
    ├── 뷰 영역 (조건부)
    │   ├── ResultTableView (when mode === 'table')
    │   │   └── HeatmapGrid
    │   │       ├── 시간 컬럼 (sticky left)
    │   │       ├── 날짜 헤더 행 (sticky top within grid)
    │   │       └── HeatmapCell × (dates × slots)
    │   └── VoteResultDataView (when mode === 'calendar', REUSE existing widget)
    └── VoteActionButtons (fixed bottom, KEEP)
```

### State Flow

```
useViewMode() → { mode: 'table'|'calendar', toggle: () => void }
├── 초기값: 'table'
├── ViewToggle onClick → toggle
└── 뷰 영역 렌더 분기

computeHeatmapIntensity(slotData)
  → Map<cellKey, opacityLevel>
  ├── 0명 슬롯 제외
  ├── count 내림차순 정렬
  ├── 동률 그룹화
  ├── 1~5위 그룹에 [100, 70, 50, 30, 10] 적용
  └── 6위 이하 → null (베이스 톤)

HeatmapCell({ cellKey, intensity }) → opacity 클래스 매핑
```

### Update Agent Context

```bash
.specify/scripts/bash/update-agent-context.sh claude
```

## Implementation Order (조감)

P1 핵심 → P2 보조 순으로 작업:

1. entity 스켈레톤(`voteTimeSlotStat`) — dto/mock/api 스텁
2. lib(`timeSlotConstants`, `computeHeatmapIntensity`, `slotKey`) — 단위테스트 가능
3. UI 부속(`ViewToggle`, `ResultCountBar`)
4. `HeatmapCell`, `HeatmapGrid` (sticky·스크롤 포함)
5. `ResultTableView` 조립
6. `useViewMode` 훅
7. `MeetResultTablePage` 조립 (P2 토글 동작 포함)
8. `app/meet/[meetingId]/page.tsx` 수정 — 두 데이터 준비 + MeetResultTablePage 위임
9. Storybook 스토리(선택, 기존 패턴 따름)
10. Vitest 단위테스트 + Playwright E2E 시나리오(가로·세로 스크롤·토글)

세부 task 분해는 `/speckits:tasks`에서 생성.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| (none)    | —          | —                                    |

Constitution Check 통과 — 추가 정당화 불필요.
