# Phase 0 Research — vote-rank-cards

**Feature**: 투표 결과 순위 뱃지 & 아코디언 카드 리스트뷰
**Branch**: `feat/#68-vote-rank-cards`
**Date**: 2026-04-29

## R1. 아코디언 UI 구현 방식

- **Decision**: Radix UI `@radix-ui/react-accordion` 또는 자체 `useDisclosure` + `details/summary`-like 토글 중, **자체 구현(useDisclosure 기반 단일 컴포넌트)** 채택.
- **Rationale**:
  - 프로젝트는 Radix를 부분적으로만 사용 중이며, 기존 `src/shared/hooks/useDisclosure.ts` 훅이 이미 존재해 토글 UX를 구현하기에 충분.
  - 디자인이 카드 헤더 클릭 → 본문 슬라이드가 단순한 토글이며, 다중 펼침이 기본이라 Radix Accordion의 "single/multiple" 추상화 이점이 크지 않음.
  - 신규 의존성 추가 없이 번들 영향 최소화.
- **Alternatives considered**:
  1. Radix `react-accordion` — 키보드 접근성·ARIA 자동 처리 장점이 있으나, 본 범위는 "기본 수준 접근성"으로 한정되어 있어 과한 옵션.
  2. `<details>/<summary>` 네이티브 — 트랜지션·스타일 일관성 확보가 까다로워 제외.

## R2. 뱃지 컴포넌트 재사용

- **Decision**: 기존 `src/shared/ui/Badge.tsx`를 확장(`rank4`, `rank5` variant 추가)하여 사용. 단, 색상 토큰은 본 기능에서 신규 추가가 필요하므로 기존 `rank1~3` variant를 함께 재정비한다(현재는 `rank1=rank2=rank3` 동일 색이라 스펙 미충족).
- **Rationale**:
  - Badge는 이미 CVA 기반이며 동일 구조의 variant 추가가 자연스러움.
  - 한 곳에서 색상 그룹 규칙(1위 단독 / 2~3위 동일 / 4~5위 동일)을 정의해 재사용성과 일관성 확보.
- **Alternatives considered**:
  1. 별도 `RankBadge` 컴포넌트 신규 생성 — 도메인성이 약하지 않아 `shared/ui/Badge`에 두는 것이 자연스럽고, 신규 파일이 늘어나는 단점.
  2. inline Tailwind 클래스 — 일관성 부족, 다른 곳 재사용 어려움.

## R3. 색상 토큰

- **Decision**: 기존 디자인 토큰(`primary-default`, `gray-*` 등)에서 임시로 매핑하고, **정확한 헥스코드는 Figma 노드(3650-30335 / 3627-6468)에서 plan 단계 종료 후 디자이너 확인 또는 노드 추출로 대체**한다. 대체 시 plan에 명시된 토큰명만 교체하면 되도록 Badge variant에 의존성을 가둔다.
- **Rationale**:
  - 본 기능은 UI 우선이며 색상 정확도는 시각적 검수 단계에서 보정 가능. 구조 결정을 색상 확정에 묶지 않는다.
  - 토큰 변경 영향 범위를 Badge 1개 파일로 좁힌다.
- **Alternatives considered**: hex 직접 입력 — 디자인 시스템 일관성 깨질 위험.

## R4. RankedSlot 산정 알고리즘

- **Decision**: `lib/rankSlots.ts` 순수 함수로 구현. 입력은 `{ slot: TimeSlotInput, canCount: number }[]`, 출력은 `RankedSlot[]` (rank: 1~5 | null, group: 'rank1' | 'rank2-3' | 'rank4-5' | 'none').
- **알고리즘**:
  1. 0표 슬롯은 별도 분리(rank 부여 대상 외).
  2. 1표 이상 슬롯을 `canCount` 내림차순 정렬, 동률 슬롯은 보조 정렬(임박한 미래 날짜 → 같은 날짜 내 이른 시간) 적용.
  3. 동률 그룹 단위로 순위 부여: 누적 카운트로 다음 순위 계산(예: 공동 2위 2개 → 다음 4위).
  4. 부여된 순위가 6 이상이면 rank=null.
  5. 전원 동률(unique count 1개) + 슬롯 5장 초과 케이스: 임박한 날짜 순 5장만 노출(`visible=true`), 나머지 `visible=false`(또는 배열에서 제외).
  6. 0표 슬롯은 정렬된 결과 뒤에 임박한 날짜 순으로 이어붙임(rank=null, group='none').
- **Rationale**: 기존 `src/entities/voteDateStat/lib/calculateRank.ts`는 날짜-only & 단일 타깃용이라 시간 슬롯·동률 그룹 처리에 부적합. 신규 `features/vote-rank-cards/lib/rankSlots.ts`로 분리해 단위 테스트 가능한 순수 함수로 유지.
- **Alternatives considered**: `entities/voteDateStat`에 두기 — 그러나 본 ViewModel은 시간 슬롯 + 색상 그룹까지 포함된 표시용 모델이어서 features 레이어가 적합.

## R5. mock 어댑터 설계

- **Decision**: `features/vote-rank-cards/lib/toRankedSlots.ts` 어댑터를 두어 `Meeting + Participant[]`(사용자 제시 샘플) → `RankedSlot[]`로 변환. test 페이지는 fixture(`features/vote-rank-cards/lib/mock.ts`) → 어댑터 → 카드 컴포넌트 흐름.
- **Rationale**: 컴포넌트 입력은 ViewModel만 받게 해, 추후 실 API 응답이 들어와도 어댑터 한 곳만 교체.
- **Alternatives considered**: 컴포넌트가 raw DTO를 직접 받기 — 변경 비용·테스트 복잡도 상승.

## R6. 기존 자산 재사용 매트릭스

| 자산                      | 위치                                             | 본 기능에서의 사용                                                                                      |
| ------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `Badge` (CVA)             | `src/shared/ui/Badge.tsx`                        | rank1·rank2·rank3 variant **재정비**, rank4·rank5 **추가**                                              |
| `useDisclosure`           | `src/shared/hooks/useDisclosure.ts`              | 카드별 펼침 상태 토글                                                                                   |
| `cn` util                 | `src/shared/lib/utils.ts`                        | className 병합                                                                                          |
| `formatDate`, `parseDate` | `src/shared/lib/date.ts`                         | 날짜 포맷·정렬 비교                                                                                     |
| `Person`, 공용 타입       | `src/shared/types/common.ts`                     | 참여자 이름 표시                                                                                        |
| 기존 `calculateRank`      | `src/entities/voteDateStat/lib/calculateRank.ts` | **사용하지 않음** (역할 다름; 본 기능은 신규 `rankSlots`)                                               |
| `MeetResponse` DTO        | `src/entities/meet/dto/meet.dto.ts`              | **사용하지 않음** (현재 DTO에는 voteTimeSlots/timeRange 부재; mock 입력 타입은 본 기능 lib에 신규 정의) |

## R7. 라우트·페이지 배치

- **Decision**: test 페이지는 `src/app/test/vote-rank-cards/page.tsx`로 신설. 페이지는 fixture를 어댑터에 통과시켜 카드 리스트 컴포넌트(`VoteRankCardsPage`)에 전달하는 얇은 라우팅 엔트리.
- **Rationale**: 기존 `src/app/test/bottom-sheet/page.tsx` 패턴과 일관.
- **Alternatives considered**: 기존 `/test/page.tsx` 인덱스 추가 — 본 범위에서는 단일 진입점이면 충분.

## R8. 테스트 전략

- **Decision**:
  - **Vitest 단위 테스트**: `lib/rankSlots.ts`(rank 산정 알고리즘), `lib/toRankedSlots.ts`(어댑터 매핑) 두 순수 함수에 한정해 작성. 동률·전원 동률·0표·5슬롯 이하·임박 정렬 케이스 커버.
  - **Storybook 시각 검증**: `VoteRankCard` 컴포넌트, `VoteRankCardsPage` 컴포넌트의 다양한 mock state stories 작성(빈 / 일반 / 전원 동률 / 6개 이상).
  - **Playwright e2e**: 본 범위에서는 추가하지 않음(스코프상 test 페이지 한정 UI; 실 서비스 라우트 연결 시 후속).
- **Rationale**: 핵심 비즈니스 로직(rank 산정)은 단위 테스트로 견고히 보장하고, UI는 Storybook으로 빠른 시각 회귀 확인.

## R9. 접근성

- **Decision**: 카드 헤더는 `<button type="button">`로 감싸 키보드 포커스·Enter/Space 활성화 기본 지원. `aria-expanded`, `aria-controls` 속성을 헤더↔본문에 연결. 이상은 후속 확장.
- **Rationale**: 스펙상 "기본 수준만 제공"으로 한정. 최소 비용으로 키보드 사용성 확보.

## R10. Out-of-Scope 재확인

- 테이블뷰(히트맵) 1위 강조, 셀 상세 모달 헤더 뱃지, 실 API 연동, CTA 동작은 모두 plan 범위 밖.
