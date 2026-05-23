# Phase 0 — Research: 087-meet-figma-sync-fixes

본 폴리시는 신규 기술 도입이 없는 작은 변경 묶음이지만, 미묘한 결정 4개가 있다.

## R-1. 모임명/모임장 정규식에 공백 허용 표현

**Decision**: 기존 정규식 문자 클래스에 **반각 공백(` `, U+0020)** 만 추가.

- `useMeetCreateForm.ts` 의 `validateHostName` 내부 `^[ㄱ-힣a-zA-Z]*$` → `^[ㄱ-힣a-zA-Z ]*$`
- 모듈 상수 `MEETING_NAME_REGEX = /^[ㄱ-힣a-zA-Z0-9]*$/` → `/^[ㄱ-힣a-zA-Z0-9 ]*$/`

**Rationale**: spec FR-001 / FR-002 가 "반각 공백" 으로 명시. spec Out of Scope 에 따르면 전각 공백/NBSP 는 차단되어야 하므로 `\s` 같은 광범위 토큰은 사용 불가.

**Alternatives**:

- `\s` — 탭/줄바꿈/NBSP/전각공백까지 통과해 Out of Scope 위반.
- 외부 validator 라이브러리 — 의존성 추가 비용 대비 이득 없음.
- 정규식을 없애고 `String.prototype.test` 대신 화이트리스트 함수 작성 — 한 줄 변경으로 끝나는 작업을 과하게 키움.

## R-2. 모임명 "완전 빈 입력 vs 공백만 입력" 분기

**Decision**: `handleMeetingNameChange` 안에서 두 케이스를 명시 분리하고, `isValid` 도출에 별도 플래그(`isMeetingNameEmptyTrimOnly`)를 추가.

```typescript
const isMeetingNameEmptyTrimOnly =
  meetingName !== '' && meetingName.trim() === '';
```

- `value === ''` → 에러 비움, placeholder fallback(handleSubmit의 `meetingName.trim() || meetingNamePlaceholder`) 그대로 활용.
- `value !== '' && value.trim() === ''` → 에러 메시지 `"공백만 입력할 수 없어요"` 설정, `isValid=false`.
- 그 외 → 기존 정규식 검증.

**Rationale**: spec FR-003a, FR-003b 정확 매핑. handleSubmit 분기를 손대지 않아 회귀 위험 최소.

**Alternatives**:

- onChange 시점에 `setMeetingName(value.trimStart())` 식으로 공백 차단 — 사용자 의도(공백 입력)를 즉시 지워 UX 불량.
- handleSubmit 진입 후 검사 → CTA 활성 상태에서 누른 뒤 에러가 떠 흐름 끊김. spec은 CTA 자체가 비활성이어야 함.

## R-3. 에러 메시지 문구

**Decision**: 모임명 공백만 입력 시 에러 메시지는 `"공백만 입력할 수 없어요"` 로 고정.

**Rationale**: 기존 에러 문구(`"한글, 영문, 숫자만 입력 가능해요"`, `"한글, 영문만 입력 가능해요"`) 톤(부정·구체)에 맞춤. 길지 않고 화면 한 줄에 충분히 들어감.

**Alternatives**: `"이름을 입력해주세요"` — placeholder 안내와 톤이 겹쳐 모호.

## R-4. 시간 라벨 두 자리수 포맷

**Decision**: 두 컴포넌트에서 인라인으로 `String(group.hour).padStart(2, '0')`.

**Rationale**: spec FR-010 — 레이아웃 변경 없이 표시 포맷만 바꾼다. 한 줄 표현이라 util 분리는 과한 추상화.

**Alternatives**:

- `lib/formatHourLabel.ts` 추출 후 import — 두 곳에서 동일 식. 함수 호출 비용은 무시할 수준이지만, 한 줄짜리 표현을 별도 파일로 빼면 가독성 손해. (만약 추후 라벨 포맷이 더 복잡해질 시점에 추출.)
- `Intl.NumberFormat` — 오버킬.

## R-5. 결과 토글 아이콘 자산

**Decision**: Figma MCP `get_design_context` / `get_screenshot` 으로 노드 [3639:20842](https://www.figma.com/design/3QGpLOWvN7ZvBpYhqqzcJ4/moit-UI-Design?node-id=3639-20842&m=dev) (grid 상태) / [3650:30362](https://www.figma.com/design/3QGpLOWvN7ZvBpYhqqzcJ4/moit-UI-Design?node-id=3650-30362&m=dev) (calendar 상태) 의 thumb 내부 아이콘 SVG 마크업을 얻어 `ViewToggle.tsx` 의 두 인라인 SVG 블록을 교체한다.

**Rationale**: spec FR-011 / FR-012 — 동작은 유지하고 아이콘 자산만 시안 일치. 1쌍의 아이콘은 재사용처가 없으므로 `shared/ui/icons/` 추출 불필요.

**Alternatives**:

- `shared/ui/icons/ResultViewToggleIcon.tsx` 컴포넌트화 → 재사용 없는 1회용. 과한 분리.
- PNG/IMG 태그 사용 → 해상도 손실, 다크모드 대응 어려움, 번들 크기 증가.

**Implementation note**: 구현 단계에서 Figma MCP 사용 시, 첫 호출이 thumb pill 만 반환할 수 있다. 부모 노드(토글 컨테이너) 또는 더 깊은 자식(아이콘 그룹) ID 로 다시 호출해야 SVG path 가 나옴. 시안 노드 ID 가 작은 thumb pill 만 잡히는 경우, `mcp__claude_ai_Figma__get_design_context` 의 `forceCode: true` 옵션 또는 형제 노드 탐색으로 아이콘 자산을 확보.

## R-6. 회귀 보호 전략

**Decision**:

1. `useMeetCreateForm` 의 정규식 + whitespace-only 분기에 대한 **Vitest 단위 테스트 1개** 신규 작성 (`useMeetCreateForm.test.ts`).
2. 시간 라벨 두 자리수는 기존 Storybook (`HeatmapGrid.stories.tsx`, `ResultTableView.stories.tsx`) 시각 회귀로 검증. story args의 `timeRange.startTime` 이 `00:00` 등 한 자리 시각을 포함하는지 확인 후 미포함이면 추가.
3. 토글 아이콘 교체는 Storybook 추가 story 또는 디자이너 OK 1회로 종결.

**Rationale**: Playwright E2E 신규 케이스 추가 비용 > 본 폴리시 회귀 위험.

**Alternatives**:

- E2E 추가 — 회귀 가치 대비 비용 과다.
- 회귀 보호 없이 머지 — `useMeetCreateForm` 분기가 미묘해 단위 테스트 권장.
