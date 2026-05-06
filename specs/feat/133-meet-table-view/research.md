# Phase 0 Research: 모임 테이블뷰 화면

**Feature**: feat/#133-meet-table-view | **Date**: 2026-04-30

## Research Items

### R-001: 시간 슬롯 데이터 모델 가용성

**Question**: 30분 단위 시간 슬롯 투표 데이터를 어디서 가져오는가? 현재 `voteDates: string[]`(날짜만)와 어떻게 공존하는가?

**Decision**: 본 명세는 표시 계층만 다루고, 데이터 모델/API 확장은 별도 명세에 의존(spec.md Assumptions). 구현 시 신규 entity `voteTimeSlotStat`을 기존 `voteDateStat` 패턴 그대로 mirror하여 다음 3종을 만든다:

- `dto/voteTimeSlotStat.dto.ts` — zod 스키마 + TS 타입
- `lib/mock.ts` — meetingId·후보 날짜 기반 결정론적 mock 생성기
- `api/fetchVoteTimeSlotStat.ts` — 스텁(`throw new Error('not implemented yet')`)

**Rationale**:

- 기존 `voteDateStat`이 동일 패턴(스텁 + mock + 미구현)으로 이미 존재하므로 일관성·이해 비용 0
- 표시 계층은 mock 데이터로 100% 검증 가능(농도 5단계, 동률, 0명, 가로 스크롤 등)
- 실 API/데이터 모델 확정 시 `fetchVoteTimeSlotStat`만 채우면 되어 변경 격리

**Alternatives Considered**:

- (A) `meet` entity 확장 — 기존 `MeetResponse.participants[].voteDates`를 `voteSlots`로 바꿈. 거부: 기존 화면들(VoteResultDataView 포함)이 모두 깨짐. 본 명세 범위 초과.
- (B) `getMeetingById` 응답을 그대로 두고 클라이언트에서 매 슬롯에 균일 분배 — 거부: 의미적으로 잘못된 데이터(어느 슬롯도 진정한 가능 인원수가 아님), 농도 정책이 무의미해짐.
- (C) 별도 명세 완료 전까지 기능 보류 — 거부: 사용자가 mock 기반 진행을 명시 선호(spec Assumption).

---

### R-002: 토글 상태 영속화

**Question**: 페이지 새로고침/재진입 시 직전 뷰 모드(table/calendar)를 유지해야 하는가?

**Decision**: 영속화 안 함. 기본은 항상 `'table'`. 페이지 내부 `useState`만으로 관리.

**Rationale**:

- spec.md Out of Scope에 "토글 상태의 URL/세션 영속화"가 명시
- 명세 FR-016: "재진입 시에도 테이블뷰가 기본"
- 가장 단순한 구현, 추후 요구 발생 시 확장 용이

**Alternatives Considered**:

- (A) URL 쿼리 `?view=calendar` — 거부: 공유 링크 의미가 모호(투표하러 들어온 사람에게도 영향), 명세 범위 초과
- (B) `localStorage` 영속화 — 거부: 명세 Out of Scope. 사용자가 의도한 동작 아님

---

### R-003: 농도 계산 정책 — 동률·컷오프·0명 처리

**Question**: 가능 인원수 기준 상위 5개 슬롯에 농도를 부여할 때, 동률·컷오프·0명을 어떻게 다루는가?

**Decision** (spec FR-005~FR-008 구현 정책):

1. **0명 제외**: 가능 인원수 0인 슬롯은 순위 산정에서 제외. 모두 베이스 톤.
2. **순위는 distinct count 기준**: 5명 동률 슬롯 3개가 1위면, 다음 distinct count는 2위. (셀 인덱스 기반 1~5위 자르기 X)
3. **동률 그룹은 같은 농도**: 1위 그룹은 모두 100%, 2위 그룹은 모두 70% 등.
4. **5위 컷오프 동률 무제한**: 5위에 동률이 100개 있어도 모두 10%로 표시. 잘라내지 않음.
5. **distinct count가 5 미만**이면 1, 2, 3, 4 단계만 적용(나머지는 베이스). 예: 슬롯에 6명 동률 1개, 3명 동률 2개만 있으면 → 6명은 100%, 3명은 70%, 그 외(0명)는 베이스.

**Pseudocode**:

```typescript
function computeHeatmapIntensity(
  slotCounts: Map<string, number>,
): Map<string, OpacityLevel | null> {
  const OPACITY = [100, 70, 50, 30, 10] as const;
  const positives = [...slotCounts.entries()].filter(([, count]) => count > 0);
  const distinctCounts = [...new Set(positives.map(([, c]) => c))].sort(
    (a, b) => b - a,
  );
  const result = new Map<string, OpacityLevel | null>();
  for (const [key, count] of slotCounts) {
    const rank = distinctCounts.indexOf(count); // 0-based
    result.set(key, rank >= 0 && rank < 5 ? OPACITY[rank] : null);
  }
  return result;
}
```

**Rationale**:

- "1위 100% / 2위 70% ..."는 사용자가 명시한 정책 그대로
- 동률을 함께 묶지 않으면 동일 데이터에 대해 슬롯 순서에 따라 색이 달라져 비결정적
- 5위 동률 100개를 잘라내면 어느 100개를 잘라낼지 자의적 → 모두 동일 색이 가장 합리적

**Alternatives Considered**:

- (A) 비율 기반 연속 농도(0~100% 무단계) — 거부: 명세는 5단계 명시
- (B) 5위 동률 시 first-N만 채색 — 거부: 비결정적
- (C) distinct count 부족 시 OPACITY 끝부터 사용(예: count 1종만 있으면 10%) — 거부: 사용자 직관(1위는 가장 진해야)과 불일치

---

### R-004: 키보드/스크린리더 접근성

**Question**: 테이블뷰의 토글 버튼·셀이 키보드/스크린리더에 어떻게 접근 가능해야 하는가?

**Decision**: 본 명세에서는 다음 최소 수준만 보장.

- **ViewToggle**: `<button>` 요소로 구현, `role="switch"` 속성, `aria-checked` 동기화, 키보드 Enter/Space 활성화. `aria-label="결과 보기 방식 전환"` 또는 보이는 텍스트 라벨 포함.
- **HeatmapGrid**: 의미적 마크업 — 외곽 컨테이너에 `role="grid"`, 시간 라벨 컬럼은 `role="rowheader"`, 날짜 헤더는 `role="columnheader"`, 셀은 `role="gridcell"` + `aria-label="{date} {time}: 가능한 사람 {n}명"`.
- 셀 키보드 포커스/탐색은 본 명세 범위 외(셀 탭 인터랙션 자체가 Out of Scope이므로 인터랙티브 X).

**Rationale**:

- ViewToggle은 인터랙티브이므로 최소한의 a11y 필수
- 그리드는 시각화 목적이라 스크린리더 사용자에게 정보 손실되지 않도록 aria-label만 부여
- spec.md 사용자가 추가 a11y 명확화는 plan에서 결정하라고 위임

**Alternatives Considered**:

- (A) 풀 a11y(셀 키보드 탐색, focus visible, screen reader announcement) — 거부: 셀 인터랙션 자체가 Out of Scope이고, 명세는 시각화 중심
- (B) a11y 무시 — 거부: 토글은 명백히 인터랙티브

---

### R-005: 날짜 헤더 sticky vs fixed

**Question**: 그리드 영역 위 날짜 헤더(요일+월일 2단)는 세로 스크롤 시 고정되어야 하는가?

**Decision**: 그리드 컨테이너 내부에서 `sticky top-0`. 페이지 단위 스크롤이 아니라 그리드 영역만 별도 스크롤 컨테이너로 만들고, 그 안에서 날짜 헤더가 sticky.

**Page Layout**:

```
[ParticipantHeader fixed top]    z-index 50
[Spacer pt-14]
[ResultCountBar]                  (스크롤 안 됨, 페이지 일부)
[HeatmapGrid 컨테이너]            (가로+세로 스크롤 영역)
  [날짜 헤더 row sticky top-0]
  [시간 라벨 컬럼 sticky left-0]
  [셀들]
[VoteActionButtons fixed bottom] z-index 50
```

**Rationale**:

- 페이지 전체 sticky로 만들면 ParticipantHeader/VoteActionButtons와 중첩되어 z-index 복잡도 증가
- 그리드 컨테이너 내부 스크롤은 모바일 터치 스크롤과 충돌 없음(과거 사례 없음 검증 필요)
- 좌측 시간 컬럼도 동일 컨테이너 내 `sticky left-0`로 같은 패턴 사용

**Alternatives Considered**:

- (A) 페이지 단위 스크롤 + sticky 헤더 — 거부: 중첩 z-index 부담, 가로 스크롤이 페이지에 영향
- (B) 가상화(react-window) — 거부: 셀 ≤ 수백 단위라 불필요한 복잡도

---

### R-006: ViewToggle 시각 형태

**Question**: 우상단 토글 위젯의 시각 형태는?

**Decision**: 현 Figma 디자인의 토글 외형(둥근 직사각형 안에 격자 아이콘)을 단순한 `<button role="switch">`로 구현. 누르면 격자 아이콘과 캘린더 아이콘이 토글되는 단일 버튼. 분리된 좌우 옵션 UI(세그먼티드)는 사용하지 않음.

**Rationale**:

- Figma는 단일 토글 표현
- 두 모드만 있으므로 버튼 하나로 충분
- 기존 `shared/ui/SegmentedControl`이 있으나 도메인 의미와 시각 형태가 달라 부적합

**Alternatives Considered**:

- (A) `SegmentedControl` 사용 — 거부: Figma와 시각 불일치
- (B) 두 개의 별도 아이콘 버튼 — 거부: 활성/비활성 표현 비대칭

---

### R-007: 시간 컬럼 라벨 표시 정책

**Question**: 좌측 시간 라벨에 정시(9, 10...)만 표시할지, 30분 단위(9:00, 9:30...)도 표시할지?

**Decision**: 정시(9, 10, 11, ...)만 표시. 30분 슬롯 구분은 `/tt/page.tsx`처럼 셀 내부 점선(`border-dashed`)으로.

**Rationale**:

- Figma 그대로
- 정보 밀도 — 모든 30분 라벨 표시 시 좌측 컬럼 폭 부담
- `/tt/page.tsx`의 검증된 패턴

**Alternatives Considered**:

- (A) 모든 30분 라벨 — 거부: Figma 디자인과 불일치
- (B) 정시만 + 30분은 짧은 dash 라벨 — 거부: 디자인 결정사항 외

---

## Decisions Summary

| ID    | Decision                                            | Impact              |
| ----- | --------------------------------------------------- | ------------------- |
| R-001 | mock + 스텁 패턴, voteTimeSlotStat entity 신규 생성 | entities/ 추가      |
| R-002 | 토글 상태 영속화 안 함, useState만                  | model/ 단순화       |
| R-003 | distinct count 기반 5단계, 동률 묶음, 0명 제외      | lib/ 순수 함수      |
| R-004 | 토글은 role=switch, 그리드는 role=grid + aria-label | ui/ 컴포넌트        |
| R-005 | 그리드 컨테이너 내부 sticky top/left                | ui/HeatmapGrid 구조 |
| R-006 | 단일 버튼 형태 토글                                 | ui/ViewToggle       |
| R-007 | 정시만 라벨, 30분은 점선                            | ui/HeatmapGrid      |

모든 Technical Context unknown 해소됨.
