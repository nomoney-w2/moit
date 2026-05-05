# vote-rank-cards Figma 정합성 정렬 설계

작성일: 2026-05-05
관련 브랜치: `feat/#68-vote-rank-cards`
관련 Figma 노드:

- 접힌 상태: `3650:30335`
- 펼친 상태: `3627:6468`

## 배경

`vote-rank-cards` 기능은 이미 머지 가능한 수준으로 구현되어 있으나, 디자이너가 최신 Figma 시안을 갱신하면서 다음 두 가지 변경이 추가되었다.

1. 카드 헤더 우측에 **인원수 표시**(`ic_people 7/9`)가 새로 추가되었다.
2. 카드 헤더의 rank chip 색상/모양과 펼친 상태의 본문 디자인이 변경되었다.

또한 검증 과정에서 기존 구현과 Figma 사이에 다수의 시각적 불일치가 발견되었다. 본 작업은 모든 불일치를 한 번에 정렬한다.

## 기존 구현과의 불일치 (검증 결과)

| #   | 항목                  | Figma                                                         | 현재 구현                                              | 위치               |
| --- | --------------------- | ------------------------------------------------------------- | ------------------------------------------------------ | ------------------ |
| 1   | 카드 인원수 표시      | `ic_people` + `7/9` 우측 표시                                 | 누락                                                   | `VoteRankCard.tsx` |
| 2   | rank chip 모양        | `rounded-[4px]` 사각형                                        | `rounded-full` 알약형                                  | `Badge.tsx`        |
| 3   | 2-3위 chip 색상       | `bg-primary-default/10` + `text-primary-default`              | `bg-primary-subtle` + `text-gray-0`                    | `Badge.tsx`        |
| 4   | 4-5위 chip 색상       | `bg-gray-100` + `text-gray-900`                               | `bg-gray-300` + `text-gray-700`                        | `Badge.tsx`        |
| 5   | 카드 외곽 모서리      | `rounded-[8px]`                                               | `rounded-2xl(16px)`                                    | `VoteRankCard.tsx` |
| 6   | 펼친 카드 참여자 표시 | gray-100 chip 형태                                            | 인라인 텍스트                                          | `VoteRankCard.tsx` |
| 7   | "가능해요" 섹션 헤더  | `ic_circle_check_filled` + `text-primary-default text-body-5` | `text-body-2 font-semibold text-gray-900`(아이콘 없음) | `VoteRankCard.tsx` |
| 8   | "못와요" 섹션 헤더    | `ic_circle_x_filled` + `text-orange-700 text-body-5`          | `text-body-2 font-semibold text-gray-900`(아이콘 없음) | `VoteRankCard.tsx` |
| 9   | 펼친 카드 padding     | `p-5 gap-3.5`, 헤더↔본문 사이 1px divider, 본문 `gap-4`       | 헤더 `px-5 py-4` + 본문 `border-t px-5 py-4`           | `VoteRankCard.tsx` |

또한 `Badge.rank1/rank2/rank3`은 캘린더 컴포넌트(`ReactDatepicker.tsx:160-167`)에서 날짜 위 원형 뱃지로 사용 중이므로 **직접 수정하면 캘린더 디자인이 깨진다**. rank chip 변경은 별도 컴포넌트로 격리한다.

## 설계 변경

### 1. 새 컴포넌트: `RankChip`

**위치**: `src/features/vote-rank-cards/ui/RankChip.tsx`

**책임**: 카드 헤더에서 표시되는 순위 chip을 렌더링.

**Props**:

```ts
interface RankChipProps {
  rank: 1 | 2 | 3 | 4 | 5;
}
```

**구현 형태**: `<span>` 요소 (카드 헤더 자체가 `<button>`이므로 nested button 방지를 위해 button이 아닌 inline 요소).

**색상 매핑**:
| rank | 배경 | 텍스트 |
|---|---|---|
| 1 | `bg-primary-default` | `text-gray-0` |
| 2, 3 | `bg-primary-default/10` | `text-primary-default` |
| 4, 5 | `bg-gray-100` | `text-gray-900` |

**공통 스타일**: `inline-flex items-center justify-center rounded-[4px] px-2 py-[2px] text-caption-7`.

**Badge 영향**: `Badge.tsx`는 손대지 않는다. `Badge.rank4/rank5` variant는 본 작업 이후 사용처가 사라지지만, 본 작업 범위에서는 제거하지 않는다(별도 cleanup PR 권장).

### 2. `VoteRankCard.tsx` 헤더 수정

#### 2-1. rank chip 교체

기존:

```tsx
<Badge variant={getRankBadgeVariant(slot.rank)} size='sm'>
  {slot.rank}위
</Badge>
```

변경 후:

```tsx
<RankChip rank={slot.rank as 1 | 2 | 3 | 4 | 5} />
```

`getRankBadgeVariant` 헬퍼 및 `Badge`/`BadgeProps` import 제거.

#### 2-2. 우측 인원수 + 화살표 영역 추가

카드 헤더는 `flex` 좌·우 분할 구조로 변경한다.

```
[좌측: 날짜·시간·rank chip]                  [우측: 인원수 표시 + arrow]
```

우측 영역 구조:

```tsx
<div className='flex items-center gap-1'>
  <div className='flex items-center gap-0.5'>
    <Icon name='ic_people' size={16} />
    <span className='text-body-4 text-text-tertiary'>
      <span className='text-gray-900'>{slot.canCount}</span>
      <span>/{totalVoters}</span>
    </span>
  </div>
  <Icon
    name='arrow_down'
    size='sm'
    className={cn(
      'text-text-tertiary transition-transform duration-200',
      isOpen && 'rotate-180',
    )}
  />
</div>
```

`totalVoters`는 prop으로 받는다(아래 4번 참고). 화살표 회전 로직은 기존과 동일하나 색상 토큰만 `text-gray-400` → `text-text-tertiary`(=`#8b95a1`)로 정렬.

### 3. 카드 외곽/펼침 구조 수정

**`<li>` (외곽 컨테이너)**:

- `rounded-2xl` → `rounded-lg` (16px → 8px)
- `border border-gray-200` 유지
- `overflow-hidden` 유지

**접힌 상태 패널**: 기존과 동일 (`px-5 py-4`).

**펼친 상태**:

- 외곽 `<button>` 헤더는 `px-5 py-4` 그대로 유지하고, 본문 영역은 다음과 같이 수정:
  - `border-t border-gray-100` 유지하되, **헤더와 본문이 동일 padding 안에서 분리되도록 헤더 padding을 일관되게 적용**
  - 본문 영역: `px-5 py-4` 유지, 본문 내부 `flex flex-col gap-4` (`gap-[16px]`)

(Figma는 `p-5 gap-3.5` 단일 컨테이너 + 1px divider 형태이지만, 현재 구조는 헤더가 `<button>`이고 본문이 별도 `<div>`이므로 동일 visual을 단순한 방식으로 재현한다. divider는 `border-t border-gray-100`로 충분히 매칭됨.)

### 4. `VoteRankCardList` → `VoteRankCard` prop 전달

`totalVoters`(=분모)를 카드까지 전달해야 한다.

**`VoteRankCardList.tsx`**:

```tsx
interface VoteRankCardListProps {
  result: RankedListResult;
  openIds: Set<TimeSlotId>;
  onToggle: (id: TimeSlotId) => void;
}

// 내부에서 result.totalVoters를 카드에 전달
<VoteRankCard
  slot={slot}
  totalVoters={result.totalVoters}
  isOpen={openIds.has(slot.id)}
  onToggle={onToggle}
/>;
```

**`VoteRankCard.tsx`**:

```ts
interface VoteRankCardProps {
  slot: RankedSlot;
  totalVoters: number;
  isOpen: boolean;
  onToggle: (id: TimeSlotId) => void;
}
```

### 5. 펼친 카드 본문 리디자인

기존 `VoteRankCardBody`를 다음과 같이 수정한다.

#### 5-1. "가능해요" 섹션

```tsx
<section className='flex flex-col gap-2'>
  <div className='text-body-5 text-primary-default flex items-center gap-0.5'>
    <Icon name='ic_circle_check_filled' size={16} />
    {slot.canCount}명이 가능해요
  </div>
  {slot.canCount > 0 ? (
    <div className='flex flex-wrap gap-1.5'>
      {slot.canPeople.map((p) => (
        <Chip
          key={p.id}
          text={p.name}
          variant='fill'
          size='sm'
          selectable={false}
        />
      ))}
    </div>
  ) : (
    <p className='text-body-5 text-text-tertiary'>아무도 없어요</p>
  )}
</section>
```

#### 5-2. "못와요" 섹션

```tsx
<section className='flex flex-col gap-2'>
  <div className='text-body-5 flex items-center gap-0.5 text-orange-700'>
    <Icon name='ic_circle_x_filled' size={16} />
    {slot.cannotCount}명이 못와요
  </div>
  {slot.cannotCount > 0 ? (
    <div className='flex flex-wrap gap-1.5'>
      {slot.cannotPeople.map((p) => (
        <Chip
          key={p.id}
          text={p.name}
          variant='fill'
          size='sm'
          selectable={false}
        />
      ))}
    </div>
  ) : (
    <p className='text-body-5 text-text-tertiary'>모두 가능해요</p>
  )}
</section>
```

본문 컨테이너는 `flex flex-col gap-4`.

이 패턴은 `VoteResultsShell.tsx:73-119`에 이미 존재하는 동일 형태이므로 코드베이스 일관성을 유지한다. `Chip` 모서리는 Figma `rounded-[4px]` vs `Chip` sm `rounded-[6px]` 차이가 있으나 코드베이스 일관성 우선으로 `Chip` 기본값을 그대로 사용한다(별도 override 없음).

### 6. 영향 범위 / 비변경

다음은 본 작업에서 **변경하지 않는다**:

- `Badge.tsx`의 어떤 variant도 수정하지 않음 (캘린더 영향 방지).
- `Chip.tsx`의 사이즈/색상 토큰도 수정하지 않음 (다른 호출부 영향 방지).
- `RankedSlot` / `RankedListResult` 도메인 타입은 변경 없음 (이미 `canCount`, `totalVoters` 존재).
- `toRankedSlots` 어댑터 로직은 변경 없음.
- `useVoteRankCardToggle` 토글 훅은 변경 없음.

## 테스트 / 검증

기존 단위 테스트(`rankSlots.test.ts`, `toRankedSlots.test.ts`)는 도메인 로직만 검증하므로 그대로 통과해야 한다.

UI 검증:

- Storybook `VoteRankCard.stories.tsx` 시나리오들을 갱신: 각 rank별 chip 색상, 펼친 상태, 인원수 표시.
- Storybook `VoteRankCardsPage.stories.tsx`로 전체 페이지 정합성 확인.
- 개발 서버에서 Figma 스크린샷과 육안 비교.

## 결정 사항 요약

| 결정                  | 선택                 | 이유                                                            |
| --------------------- | -------------------- | --------------------------------------------------------------- |
| rank chip 구현 방식   | 별도 `RankChip` 신설 | Badge 변경 시 캘린더 깨짐, Chip은 button이라 nested button 문제 |
| 참여자 이름 chip      | 기존 `Chip` 재사용   | 코드베이스에 동일 패턴 존재, 일관성                             |
| Chip 모서리 override  | 하지 않음            | 코드베이스 일관성 > 1px 시각 차이                               |
| 카드 외곽 모서리      | `rounded-lg` (8px)   | Figma 일치                                                      |
| Badge variant cleanup | 본 작업 범위 외      | 별도 cleanup PR 권장                                            |
