# Implementation Plan: 모임 생성·투표 결과 Figma 시안 일치 폴리시

**Branch**: `feat/#87-meet-figma-sync-fixes` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)
**Issue**: [#87](https://github.com/nomoney-w2/moit/issues/87)
**Input**: Feature specification from `/specs/feat/087-meet-figma-sync-fixes/spec.md`

## Summary

기존 모임 생성/투표 결과 화면에서 Figma 시안과 어긋난 4가지 자잘한 폴리시를 **새 화면·라우트 추가 없이 기존 파일 일부 수정**으로 해결한다.

1. 시간 슬롯 그리드 좌측 시 라벨을 `String(hour).padStart(2, '0')` 로 두 자리수 표시
2. **이름 성격 입력 3 흐름**의 정규식에 반각 공백을 추가하고 공백-only 입력에 대한 에러/CTA 가드를 일관 적용:
   - `useMeetCreateForm` — 모임장 + 모임명 (모임명은 `""` ↔ `"   "` 분기로 placeholder fallback 보존)
   - `useParticipantRegisterName` — 참여자 이름 등록
   - `useParticipantEditName` — 참여자 이름 수정/검색
3. `ViewToggle` 의 thumb 내부 SVG 아이콘을 Figma 노드(3639:20842 / 3650:30362)에서 추출한 자산으로 교체

데이터 모델/API/네트워크 변경 없음. 클라이언트 UI·검증 폴리시 한정.

## Technical Context

**Language/Version**: TypeScript 5
**Primary Dependencies**: Next.js 16 (App Router), React 19, Tailwind CSS 4 + CVA + clsx + tailwind-merge
**Styling Helpers**: 기존 `shared/ui/input/Input.tsx` 의 `errorMessage` prop 재사용
**Storage**: N/A — 본 작업은 백엔드/로컬 저장 변경 없음
**Testing**: Vitest (단위 — `useMeetCreateForm` + `useParticipantRegisterName` + `useParticipantEditName` 3 hook 회귀 보강), Storybook (시각 회귀 — `HeatmapGrid.stories.tsx`, `ResultTableView.stories.tsx`)
**Target Platform**: 모바일 웹 (iOS Safari, Android Chrome) + 데스크탑 Chrome
**Project Type**: single — `src/` 단일 Next.js 앱
**Performance Goals**: 폴리시 작업이므로 성능 영향 없음 — 기존 60fps 그리드 렌더 유지
**Constraints**: 레이아웃 시프트 0 (`TIME_COL_W=40` 유지), 기존 회귀 0, 백엔드/API/저장 형식 미변경
**Scale/Scope**: 수정 파일 6개 (`useMeetCreateForm.ts`, `useParticipantRegisterName.ts`, `useParticipantEditName.ts`, `TimeSlotGrid.tsx`, `HeatmapGrid.tsx`, `ViewToggle.tsx`) + 단위 테스트 3개(3 hook 각각, 회귀 보호 권장)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 원칙                                                               | 적용 여부 | 비고                                                                        |
| ------------------------------------------------------------------ | --------- | --------------------------------------------------------------------------- |
| I. FSD 레이어 (`app → features → entities → shared`)               | ✅ Pass   | 수정 대상은 모두 기존 `features/*` 하위 파일. 신규 entity/api/widgets 없음. |
| II. Project Structure (`src/` 단일 앱)                             | ✅ Pass   | 신규 디렉토리 없음.                                                         |
| III. No Barrel Exports                                             | ✅ Pass   | 신규 export 없음. 기존 import 경로 유지.                                    |
| IV. Unidirectional Dependencies                                    | ✅ Pass   | 수정은 모두 `features/*/model` 또는 `features/*/ui` 내부 한정.              |
| V. Code Style (function declaration, camelCase, `handle*`, `use*`) | ✅ Pass   | 기존 컴포넌트 함수 선언/네이밍 그대로 유지.                                 |
| Tech Stack                                                         | ✅ Pass   | TS5/React19/Next16/Tailwind4 그대로. 신규 의존성 0.                         |

**Gate Result**: ✅ All gates pass — Phase 0 진입.

## Project Structure

### Documentation (this feature)

```text
specs/feat/087-meet-figma-sync-fixes/
├── plan.md              # This file
├── research.md          # Phase 0 output — Figma asset 추출 방법 / whitespace 정규식 결정
├── data-model.md        # Phase 1 output — N/A (no domain entity changes), 정책 표만 기록
├── contracts/           # Phase 1 output — N/A (no API), 비어 있음 또는 README 한 줄
├── quickstart.md        # Phase 1 output — 로컬 시각 확인 절차
├── checklists/
│   └── requirements.md  # /speckits:specify 출력물
└── tasks.md             # /speckits:tasks 가 작성 (본 단계에서는 미생성)
```

### Source Code (repository root)

본 작업은 **신규 파일 0개, 기존 파일 수정 6개** 가 기본 계획이다.

```text
src/
├── features/
│   ├── meet-create/
│   │   └── model/
│   │       └── useMeetCreateForm.ts                  # ✏️ 정규식 + meetingName whitespace-only 분기
│   ├── participant-register-name/
│   │   └── model/
│   │       └── useParticipantRegisterName.ts         # ✏️ 정규식 공백 추가 + whitespace-only 분기 + isValidInput 확장
│   ├── participant-edit-name/
│   │   └── model/
│   │       └── useParticipantEditName.ts             # ✏️ 정규식 공백 추가 + whitespace-only 분기 + isValidInput 확장
│   ├── participant-register-time-slot/
│   │   └── ui/
│   │       └── TimeSlotGrid.tsx                      # ✏️ {group.hour} → padStart(2,'0')
│   └── meet-result-table/
│       └── ui/
│           ├── HeatmapGrid.tsx                       # ✏️ {group.hour} → padStart(2,'0')
│           └── ViewToggle.tsx                        # ✏️ thumb SVG 아이콘 교체 (Figma sync)
└── (그 외 변경 없음)
```

신규 단위 테스트(권장, optional):

```text
src/features/meet-create/model/useMeetCreateForm.test.ts                 # ➕ 공백 허용 / whitespace-only 회귀 보강
src/features/participant-register-name/model/useParticipantRegisterName.test.ts  # ➕ (선택) 동일 회귀
src/features/participant-edit-name/model/useParticipantEditName.test.ts          # ➕ (선택) 동일 회귀
```

Storybook(권장, optional):

- `HeatmapGrid.stories.tsx`, `ResultTableView.stories.tsx` 의 시간 범위가 `00:00 ~ 23:00` 케이스를 포함하도록 args 검토. 새 story 추가는 불필요 (기존 story가 라벨 표시 회귀를 잡아준다).

**Structure Decision**: 본 폴리시는 새 feature/entity/widget을 만들지 않는다. **기존 6개 파일의 좁은 수정 + 회귀 테스트 1~3개(권장)** 로 끝낸다. FSD 레이어 구조 변경 없음.

## Phase 0 — Research

### R-1. 모임명 / 모임장 정규식에 공백 허용 표현

**Decision**: 기존 정규식에 반각 공백(` `, U+0020)을 문자 클래스에 추가한다.

- 모임장: `/^[ㄱ-힣a-zA-Z]*$/` → `/^[ㄱ-힣a-zA-Z ]*$/`
- 모임명: `/^[ㄱ-힣a-zA-Z0-9]*$/` → `/^[ㄱ-힣a-zA-Z0-9 ]*$/`

**Rationale**: 문자 클래스 내 단일 ASCII 공백만 추가하면 됨. `\s` 는 탭/줄바꿈/NBSP까지 매칭되어 spec의 Out of Scope("전각/NBSP 미허용")를 깨뜨리므로 피한다.

**Alternatives considered**:

- `\s` 사용 → 전각/NBSP까지 통과해 spec 위반.
- 정규식 대신 `validator` 라이브러리 도입 → 의존성 추가 비용 대비 이득 없음.

### R-2. "공백-only 입력" 일관 처리 (4 필드 · 3 hook)

**Decision**: `useMeetCreateForm` / `useParticipantRegisterName` / `useParticipantEditName` 의 onChange 핸들러 모두 동일 분기 로직을 적용한다. 모임장·모임명·참여자 이름 등록·참여자 이름 수정 **4 필드에 비대칭 없이** 같은 정책을 적용 (spec FR-003-host-ws, FR-003b, FR-003c).

```text
- value === ''                          → 에러 없음
                                           · 모임명: placeholder fallback 유지 (기존 동작, FR-003a)
                                           · 그 외 3 필드: CTA 비활성(길이 0)
- value !== '' && value.trim() === ''   → 인라인 에러 "공백만 입력할 수 없어요"
                                           · CTA 비활성 (모임명은 placeholder 자동 대체 차단)
- 그 외                                  → 기존 정규식 검증
```

`useMeetCreateForm` CTA 활성 조건(`isValid`)을 다음과 같이 확장:

```typescript
const isHostNameEmptyTrimOnly = hostName !== '' && hostName.trim() === '';
const isMeetingNameEmptyTrimOnly =
  meetingName !== '' && meetingName.trim() === '';

isValid =
  hostName.trim() !== '' &&
  !hostNameError &&
  !meetingNameError &&
  !isHostNameEmptyTrimOnly &&
  !isMeetingNameEmptyTrimOnly;
```

(엄밀히 `hostName.trim() !== ''` 만으로도 호스트 공백-only는 CTA 비활성이 보장되지만, 에러 메시지 노출 책임이 분리되어 있으므로 `validateHostName` / `handleHostNameChange` 안에서 공백-only 분기에 `setHostNameError('공백만 입력할 수 없어요')` 를 명시한다.)

각 참여자 이름 hook은 `isValidInput` 을 `name.length > 0 && !errorDetails.isError` → `name.trim().length > 0 && !errorDetails.isError` 로 강화하고, `handleNameChange` 의 정규식 통과 분기 안에 공백-only 케이스를 추가해 동일 에러 메시지를 설정한다.

handleSubmit 의 `meetingName.trim() || meetingNamePlaceholder` 분기는 그대로 둔다 — `isMeetingNameEmptyTrimOnly` 가 true 인 경우 isValid=false 가 되어 handleSubmit 자체가 호출되지 않으므로 안전하다.

**Rationale**: spec FR-003-host-ws / FR-003a / FR-003b / FR-003c 정확 매핑. 4 필드 간 에러 표기 비대칭 0 — 사용자가 어디서 공백을 쳤든 동일한 피드백을 받는다.

**Alternatives considered**:

- `value.trim()` 결과를 항상 state에 반영 → 사용자가 공백 친 직후 입력이 사라지는 UX 불량.
- placeholder 후보를 무공백 문구로 바꿔 모순 해소 → spec Out of Scope 위반.
- 모임장만 에러 메시지 미노출 (기존 단순화 안) → 4 필드 간 비대칭 발생, spec analyze 단계에서 I1 으로 지적되어 폐기.

### R-3. 시간 라벨 두 자리수 포맷

**Decision**: 두 그리드 컴포넌트(`TimeSlotGrid`, `HeatmapGrid`) 좌측 라벨에서 `{group.hour}` → `{String(group.hour).padStart(2, '0')}` 로 교체.

**Rationale**: spec FR-008 / FR-009 / FR-010 그대로. 라벨 폭(`TIME_COL_W=40`) 은 `01`~`23` 모두 수용 가능 — 변경 없음.

**Alternatives considered**:

- 새 `lib/formatHourLabel.ts` 유틸 추출 → 한 줄짜리 표현식이라 과한 추상화. 두 파일에서 동일 식 사용으로 충분.

### R-4. 결과 토글 아이콘 자산 추출

**Decision**: Figma MCP 의 `get_design_context` / `get_screenshot` 으로 노드 3639:20842 (grid 상태), 3650:30362 (calendar 상태) 의 thumb 내부 아이콘 SVG 마크업/자산을 확보해 `ViewToggle.tsx` 의 현재 인라인 SVG 두 블록을 교체한다.

**Rationale**: 토글 자산은 작은 아이콘(≤24px) 1쌍이며, 별도 컴포넌트로 추출할 만큼 재사용성이 없다. 인라인 SVG 유지로 props 전파/번들 영향 최소.

**Alternatives considered**:

- `shared/ui/icons/` 로 추출 → 재사용처 없는 1회용 아이콘. 과한 분리.
- 비트맵 PNG 사용 → 해상도 손실, 다크모드 대응 어려움.

### R-5. 회귀 보호

**Decision**:

- 3 hook (`useMeetCreateForm`, `useParticipantRegisterName`, `useParticipantEditName`) 각각에 대해 **단위 테스트 3개** 를 신규 작성. 정규식 공백 허용 / whitespace-only 분기 / 특수문자 회귀 / maxLength 한계 케이스를 포함.
- 시간 라벨/토글 아이콘은 기존 Storybook 시각 회귀(`HeatmapGrid.stories.tsx`, `ResultTableView.stories.tsx`) 로 검증.
- E2E (Playwright) 신규 케이스는 추가하지 않음 — 표현형 변경이라 단위/시각 회귀로 충분.

**Rationale**: 폴리시 작업의 회귀 비용 < 신규 E2E 비용.

## Phase 1 — Design & Contracts

### Entities

해당 없음. **`data-model.md` 는 placeholder 로만 생성** (도메인 모델 변경 없음을 명시).

### API Contracts

해당 없음. **`contracts/` 디렉토리는 비워 둔다** (네트워크 변경 없음).

### Component / Hook Touch Map (FSD)

```text
features/meet-create/
└─ model/useMeetCreateForm.ts
   ├─ validateHostName 정규식: /^[ㄱ-힣a-zA-Z]*$/ → /^[ㄱ-힣a-zA-Z ]*$/    # ✏️ space 추가
   ├─ validateHostName 또는 handleHostNameChange:
   │    if (value !== '' && value.trim() === '') {
   │      setHostNameError('공백만 입력할 수 없어요');
   │    } else if (...정규식 위반) { ...기존... }
   │    else setHostNameError('');
   ├─ const MEETING_NAME_REGEX = /^[ㄱ-힣a-zA-Z0-9 ]*$/                   # ✏️ space 추가
   ├─ handleMeetingNameChange:
   │    if (newValue !== '' && newValue.trim() === '') {
   │      setMeetingNameError('공백만 입력할 수 없어요');
   │    } else if (...정규식 위반) { ...기존... }
   │    else setMeetingNameError('');
   ├─ isValid: isHostNameEmptyTrimOnly + isMeetingNameEmptyTrimOnly 두 플래그 추가
   └─ (handleSubmit 변경 없음 — isValid=false 면 호출 자체가 안 됨)

features/participant-register-name/
└─ model/useParticipantRegisterName.ts
   ├─ const REGEX_NAME = /^[ㄱ-힣a-zA-Z]*$/ → /^[ㄱ-힣a-zA-Z ]*$/   # ✏️ space 추가
   ├─ handleNameChange: value !== '' && value.trim() === '' 분기에 인라인 에러 메시지("공백만 입력할 수 없어요") 설정
   ├─ isValidInput: name.length > 0 && !errorDetails.isError
   │   → name.trim().length > 0 && !errorDetails.isError              # ✏️ 공백-only 차단
   └─ (handleSubmit `trimmedName` 분기 그대로)

features/participant-edit-name/
└─ model/useParticipantEditName.ts
   └─ 위 useParticipantRegisterName 와 동일 패턴 적용 (정규식 1곳 + handleNameChange 분기 + isValidInput 확장)

features/participant-register-time-slot/
└─ ui/TimeSlotGrid.tsx
   └─ <div role='rowheader'>{group.hour}</div>
      → <div role='rowheader'>{String(group.hour).padStart(2, '0')}</div>

features/meet-result-table/
├─ ui/HeatmapGrid.tsx
│  └─ <div role='rowheader'>{group.hour}</div>
│     → <div role='rowheader'>{String(group.hour).padStart(2, '0')}</div>
└─ ui/ViewToggle.tsx
   ├─ thumb 내부 grid-state SVG (현재 사각형+십자 라인) → Figma 3639:20842 자산
   └─ thumb 내부 calendar-state SVG (현재 사각형+상단 점 두 개) → Figma 3650:30362 자산
```

### Quickstart (로컬 검증)

`quickstart.md` 에 다음 절차를 기록한다:

1. `npm run dev` 로 dev 서버 실행, `/create` 진입.
2. 모임장: `김 길동` 타이핑 → 에러 없이 유지, CTA 활성.
3. 모임명: `멋쟁이들 모임` 타이핑 → 에러 없음. 그 다음 모두 지우고 `   ` (공백 3번) → 에러 메시지 노출, CTA 비활성. 다시 모두 지움(`""`) → 에러 사라짐, CTA 활성(모임장 입력 가정).
4. 날짜 선택 → 시간 선택 페이지에서 시작 시간을 `00:00` 부근으로 설정 후 시간 슬롯 그리드에서 좌측 라벨 `00, 01, …` 확인.
5. 투표 진행 후 결과 페이지(`/meet/[meetingId]`) 진입 → 히트맵 그리드 좌측 라벨 두 자리수 확인 + 우상단 토글의 thumb 아이콘이 Figma 시안과 일치하는지 시각 비교.
6. Storybook(`npm run storybook`) 에서 `HeatmapGrid` story 시간 범위 `00:00~23:00` 케이스 라벨 시각 확인.

### Agent Context

`update-agent-context.sh claude` 는 본 명세에 새 기술 스택이 추가되지 않으므로 실행해도 변경점이 없을 가능성이 큼. 그래도 일관성을 위해 실행한다.

## Architecture Decisions

| Decision                       | Options                                                                                                    | Chosen                 | Rationale                                                             | FSD Impact                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 공백 허용 표현                 | (a) 문자 클래스에 ` ` 추가 (b) `\s` 사용 (c) 외부 validator                                                | (a) ASCII 공백 추가    | spec Out of Scope(전각/NBSP) 보호. 의존성 0.                          | 3 hook 정규식 4 곳 수정 (`features/meet-create/model` 2 곳 + `features/participant-register-name/model` 1 곳 + `features/participant-edit-name/model` 1 곳) |
| placeholder fallback 차단 조건 | (a) `value !== '' && value.trim() === ''` 별도 분기 (b) handleSubmit에서 검사 (c) state 자체를 trim해 저장 | (a) onChange 시점 분기 | 에러 즉시 노출 + handleSubmit 분기 보존.                              | 3 model 함수 보강 (4 필드 일관 정책)                                                                                                                        |
| 4 필드 에러 표기 정책          | (a) 모든 필드 동일 에러 (b) 호스트만 비활성, 모임명·참여자는 에러 + 비활성                                 | (a) 4 필드 동일        | 사용자가 어디서 공백을 쳤든 동일한 피드백. analyze 단계 I1 지적 반영. | `validateHostName` 에 공백-only 분기 추가                                                                                                                   |
| 시 라벨 포맷                   | (a) `padStart` 인라인 (b) `formatHourLabel` 유틸 추출                                                      | (a) 인라인             | 한 줄짜리 표현. 두 파일 동일 식. 과한 추상화 회피.                    | UI 컴포넌트만 수정                                                                                                                                          |
| 토글 아이콘 위치               | (a) `ViewToggle.tsx` 내부 인라인 SVG (b) `shared/ui/icons/` 추출                                           | (a) 인라인 유지        | 1회용 아이콘 쌍, 재사용 없음.                                         | UI 컴포넌트만 수정                                                                                                                                          |
| 회귀 보호                      | (a) Vitest 단위 + Storybook 시각 (b) +Playwright E2E (c) 시각만                                            | (a)                    | 폴리시 작업 비용 대비 합리적 커버리지.                                | `features/meet-create/model/useMeetCreateForm.test.ts` 신규 (권장)                                                                                          |

## Complexity Tracking

해당 없음 — Constitution Check 모두 Pass. 새로운 추상화/예외 없음.
