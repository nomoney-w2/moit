# Phase 1 Data Model — vote-rank-cards

**Feature**: 투표 결과 순위 뱃지 & 아코디언 카드 리스트뷰
**Branch**: `feat/#68-vote-rank-cards`
**Date**: 2026-04-29

본 기능은 실 API 없이 **mock 입력 → ViewModel 변환 → UI 렌더**의 단방향 데이터 흐름만 다룬다. 두 종류의 모델을 정의한다.

1. **Input 모델** (외부 입력; 사용자 제시 샘플 + mock fixture가 따르는 형태)
2. **ViewModel** (카드 컴포넌트가 직접 소비하는 형태)

---

## 1. Input 모델 — `MeetingVoteSnapshot`

> 위치: `src/features/vote-rank-cards/lib/types.ts`
> 비고: 실제 백엔드가 본 형태로 응답하기 전까지 본 기능 전용 타입으로 둔다. 추후 `entities/meet/dto/meet.dto.ts` 확장 시 자연스럽게 흡수 가능.

```ts
type IsoDate = string; // 'YYYY-MM-DD'
type Time = string; // 'HH:mm' (24h)
type MeetingStatus = 'VOTING' | 'FINALIZED' | 'CLOSED';

interface MeetingTimeRange {
  startTime: Time; // 슬롯 시작(예: '12:00')
  endTime: Time; // 슬롯 종료(예: '20:00')
  slotCount: number; // 한 날짜의 슬롯 개수 (예: 30분 단위 16개)
}

interface ParticipantVote {
  id: number;
  name: string;
  voteDates: IsoDate[]; // 투표한 날짜
  voteTimeSlots: boolean[][]; // [dateIndex][slotIndex] = 가능 여부
  hasVoted: boolean;
}

interface MeetingVoteSnapshot {
  id: string;
  title: string;
  dates: IsoDate[]; // 후보 날짜 (정렬 가정 없음)
  status: MeetingStatus;
  finalizedDate?: IsoDate | null;
  maxParticipantCount: number;
  participants: ParticipantVote[];
  hostName: string;
  timeRange: MeetingTimeRange;
}
```

### 제약 / 가정

- `participants[i].voteTimeSlots`의 1번째 차원 길이는 `dates.length`와 동일.
- `participants[i].voteTimeSlots[d]`의 길이는 `timeRange.slotCount`와 동일.
- `hasVoted=false`인 참여자는 `voteTimeSlots`가 비어있거나 모두 false로 간주(어떤 형태든 카운트에서 제외).
- `dates`가 정렬되어 있지 않을 수 있어, 어댑터에서 임박한 미래 날짜 우선으로 정렬 필요.

---

## 2. 도메인 파생 — `TimeSlotKey`

특정 (날짜, 슬롯 인덱스)를 고유 식별. 컴포넌트 key, 정렬 비교, ViewModel id에 사용.

```ts
interface TimeSlotKey {
  date: IsoDate;
  slotIndex: number; // 0..slotCount-1
}

// 직렬화 키: `${date}#${slotIndex}` (e.g., '2026-04-17#3')
type TimeSlotId = string;
```

---

## 3. ViewModel — `RankedSlot`

> 위치: `src/features/vote-rank-cards/lib/types.ts`
> 카드 컴포넌트의 단일 입력. UI 렌더에 필요한 모든 파생값을 포함한다.

```ts
type RankBadgeGroup = 'rank1' | 'rank2-3' | 'rank4-5' | 'none';

interface RankedSlotPerson {
  id: string; // ParticipantVote.id를 string으로 정규화
  name: string;
}

interface RankedSlot {
  id: TimeSlotId; // 'YYYY-MM-DD#slotIndex'
  date: IsoDate;
  slotIndex: number;
  startTime: Time; // 해당 슬롯 시작 시각 (포맷됨)
  endTime: Time; // 해당 슬롯 종료 시각
  rank: number | null; // 1..5 또는 null(6위 이하/0표/5장 잘림)
  badgeGroup: RankBadgeGroup;
  canPeople: RankedSlotPerson[];
  cannotPeople: RankedSlotPerson[];
  canCount: number;
  cannotCount: number;
}

interface RankedListResult {
  slots: RankedSlot[]; // 화면에 노출할 카드 순서대로
  totalVoters: number; // 헤더 'N명이 투표했어요'에 사용
  meetingTitle: string;
  hostName: string;
  isEmpty: boolean; // totalVoters === 0
  isAllTie: boolean; // 전원 동률 (정보 표시·로깅용)
}
```

### 필드 산정 규칙

- `rank`/`badgeGroup` 매핑:
  - rank=1 → `'rank1'`
  - rank=2 또는 3 → `'rank2-3'`
  - rank=4 또는 5 → `'rank4-5'`
  - rank=null → `'none'` (뱃지 영역 비움)
- `canPeople` / `cannotPeople`은 `hasVoted=true` 참여자만 포함. `voteTimeSlots[d][s] === true`이면 `canPeople`에, false면 `cannotPeople`에 들어간다.
- `canCount = canPeople.length`, `cannotCount = cannotPeople.length`. 합은 `totalVoters`와 같거나 작을 수 있음(특정 슬롯에 대해 미응답이 가능하면 별도 처리; 본 범위는 true/false 이진 가정).
- `slots` 배열 정렬: `canCount` 내림차순 → 동률 그룹 내 임박한 미래 날짜 → 같은 날짜 내 이른 시간. 0표 슬롯은 그 뒤에 임박한 날짜 순으로 이어붙임.
- 전원 동률 + 슬롯 5장 초과: 임박한 미래 날짜 순 5장만 `slots`에 포함, 나머지는 제외.

---

## 4. 어댑터 인터페이스

```ts
// src/features/vote-rank-cards/lib/toRankedSlots.ts
function toRankedSlots(
  snapshot: MeetingVoteSnapshot,
  options?: { today?: IsoDate }, // 임박 정렬 기준일(테스트 주입용). 기본은 오늘.
): RankedListResult;
```

### 책임

1. `participants` 중 `hasVoted=true` 필터.
2. `dates × slotCount` 격자를 순회하며 슬롯별 `canPeople` / `cannotPeople` 계산.
3. 슬롯 정렬 + 순위 부여 + 전원 동률 잘라내기 적용.
4. `RankedListResult` 반환.

### 산정 로직 위임

- 정렬·순위 부여는 **별도 순수 함수** `rankSlots`로 분리:

```ts
// src/features/vote-rank-cards/lib/rankSlots.ts
interface SlotCount {
  id: TimeSlotId;
  date: IsoDate;
  slotIndex: number;
  canCount: number;
}

function rankSlots(
  slotCounts: SlotCount[],
  today: IsoDate,
): Array<{ id: TimeSlotId; rank: number | null; visible: boolean }>;
```

- `rankSlots`만 단위 테스트 케이스가 풍부하게 필요하므로 단독 분리.

---

## 5. Mock Fixture

> 위치: `src/features/vote-rank-cards/lib/mock.ts`

- `mockMeetingVoteSnapshot` — Figma 시안과 동일하게 9명 투표, 다양한 동률·미투표·0표 케이스 포함.
- `mockEmptyMeetingVoteSnapshot` — 투표자 0명 (빈 상태).
- `mockAllTieMeetingVoteSnapshot` — 6슬롯 이상 모두 동률 (5장 잘라내기 검증용).

---

## 6. 컴포넌트 입력 요약

| 컴포넌트                         | 입력 타입                                  | 출처                                              |
| -------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| `VoteRankCardsPage`              | `MeetingVoteSnapshot`                      | test 페이지가 mock에서 로드                       |
| `VoteRankCardList`               | `RankedListResult`                         | `VoteRankCardsPage` 내부에서 `toRankedSlots` 호출 |
| `VoteRankCard`                   | `RankedSlot`                               | `VoteRankCardList`가 map하여 전달                 |
| `RankBadge` (Badge variant 사용) | `{ group: RankBadgeGroup; rank: number; }` | `VoteRankCard` 헤더에서 사용                      |

---

## 7. 향후 확장 시 매핑 가이드

실제 백엔드가 다음 중 하나의 형태로 응답할 때 어댑터 한 곳만 교체:

- 백엔드가 `MeetingVoteSnapshot` 형태로 그대로 응답 → `toRankedSlots` 직접 사용.
- 백엔드가 기존 `MeetResponse + voteTimeSlots`만 추가하는 형태로 진화 → 어댑터에서 `MeetResponse → MeetingVoteSnapshot` 변환 한 단계 추가 후 동일 흐름.
- 그 외 형태 → 어댑터 입력 타입만 수정하고 카드 컴포넌트는 그대로.
