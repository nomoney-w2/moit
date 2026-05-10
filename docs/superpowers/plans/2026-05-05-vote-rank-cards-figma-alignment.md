# vote-rank-cards Figma 정합성 정렬 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** vote-rank-cards 카드 헤더에 인원수(`ic_people X/N`)를 추가하고, rank chip의 색상/모양과 펼친 카드 본문 레이아웃을 최신 Figma 시안(노드 `3650:30335`, `3627:6468`)에 정렬한다.

**Architecture:** 캘린더가 사용 중인 `Badge.rank1/2/3` variant를 보존하기 위해 카드 헤더의 rank chip은 `RankChip`이라는 vote-rank-cards 로컬 컴포넌트로 분리한다. 펼친 카드 본문의 참여자 표시는 `src/features/vote-results-calendar/ui/VoteResultsShell.tsx:73-119`에 이미 존재하는 동일 패턴(`Icon ic_circle_check_filled` + `Chip variant=fill size=sm selectable=false`)을 그대로 차용하여 코드베이스 일관성을 유지한다.

**Tech Stack:** React 19, Next.js 16 (App Router), TypeScript 5, Tailwind CSS 4 (`globals.css` 토큰), Vitest, Storybook(`@storybook/nextjs-vite`).

---

## File Structure

**Create:**

- `src/features/vote-rank-cards/ui/RankChip.tsx` — 카드 헤더용 순위 chip(span 요소). props: `{ rank: 1|2|3|4|5 }`.
- `src/features/vote-rank-cards/ui/RankChip.test.tsx` — RankChip 색상/렌더링 단위 테스트.
- `src/features/vote-rank-cards/ui/RankChip.stories.tsx` — RankChip 시각 검증용 스토리.

**Modify:**

- `src/features/vote-rank-cards/ui/VoteRankCard.tsx` — Badge → RankChip 교체, 헤더 우측 인원수 영역 추가, 외곽 모서리 변경, body 구조/색상/아이콘 리디자인.
- `src/features/vote-rank-cards/ui/VoteRankCardList.tsx` — `totalVoters` prop 전달.
- `src/features/vote-rank-cards/ui/VoteRankCard.stories.tsx` — `totalVoters` args 추가.
- `src/features/vote-rank-cards/ui/VoteRankCardsPage.stories.tsx` — 필요 시 갱신(파일 변동 없으면 skip).

**Untouched (의도적으로):**

- `src/shared/ui/Badge.tsx` — 캘린더(`ReactDatepicker.tsx:160-167`) 영향 방지.
- `src/shared/ui/chip/Chip.tsx` — 다른 호출부(`VoteResultsShell`, `Dropdown`, `LinkShareBottomSheet`) 영향 방지.
- `src/features/vote-rank-cards/lib/types.ts`, `toRankedSlots.ts`, `rankSlots.ts`, `useVoteRankCardToggle.ts` — 도메인 로직 변경 없음.

---

## Task 1: `RankChip` 컴포넌트 + 단위 테스트

**Files:**

- Create: `src/features/vote-rank-cards/ui/RankChip.tsx`
- Create: `src/features/vote-rank-cards/ui/RankChip.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`src/features/vote-rank-cards/ui/RankChip.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import RankChip from '@/features/vote-rank-cards/ui/RankChip';

describe('RankChip', () => {
  it('renders the rank label', () => {
    render(<RankChip rank={1} />);
    expect(screen.getByText('1위')).toBeInTheDocument();
  });

  it('applies primary fill style for rank 1', () => {
    render(<RankChip rank={1} />);
    const chip = screen.getByText('1위').closest('span');
    expect(chip).toHaveClass('bg-primary-default');
    expect(chip).toHaveClass('text-gray-0');
  });

  it('applies primary tinted style for ranks 2 and 3', () => {
    const { rerender } = render(<RankChip rank={2} />);
    let chip = screen.getByText('2위').closest('span');
    expect(chip).toHaveClass('bg-primary-default/10');
    expect(chip).toHaveClass('text-primary-default');

    rerender(<RankChip rank={3} />);
    chip = screen.getByText('3위').closest('span');
    expect(chip).toHaveClass('bg-primary-default/10');
    expect(chip).toHaveClass('text-primary-default');
  });

  it('applies neutral style for ranks 4 and 5', () => {
    const { rerender } = render(<RankChip rank={4} />);
    let chip = screen.getByText('4위').closest('span');
    expect(chip).toHaveClass('bg-gray-100');
    expect(chip).toHaveClass('text-gray-900');

    rerender(<RankChip rank={5} />);
    chip = screen.getByText('5위').closest('span');
    expect(chip).toHaveClass('bg-gray-100');
    expect(chip).toHaveClass('text-gray-900');
  });

  it('applies shared shape classes', () => {
    render(<RankChip rank={1} />);
    const chip = screen.getByText('1위').closest('span');
    expect(chip).toHaveClass('rounded-[4px]');
    expect(chip).toHaveClass('text-caption-7');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/features/vote-rank-cards/ui/RankChip.test.tsx`
Expected: FAIL — `Cannot find module '@/features/vote-rank-cards/ui/RankChip'`.

- [ ] **Step 3: `RankChip` 구현**

`src/features/vote-rank-cards/ui/RankChip.tsx`:

```tsx
import { cn } from '@/shared/lib/utils';

export type RankChipRank = 1 | 2 | 3 | 4 | 5;

interface RankChipProps {
  rank: RankChipRank;
}

const RANK_CHIP_COLOR: Record<RankChipRank, string> = {
  1: 'bg-primary-default text-gray-0',
  2: 'bg-primary-default/10 text-primary-default',
  3: 'bg-primary-default/10 text-primary-default',
  4: 'bg-gray-100 text-gray-900',
  5: 'bg-gray-100 text-gray-900',
};

export default function RankChip({ rank }: RankChipProps) {
  return (
    <span
      className={cn(
        'text-caption-7 inline-flex items-center justify-center rounded-[4px] px-2 py-[2px]',
        RANK_CHIP_COLOR[rank],
      )}
    >
      {rank}위
    </span>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/features/vote-rank-cards/ui/RankChip.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/features/vote-rank-cards/ui/RankChip.tsx src/features/vote-rank-cards/ui/RankChip.test.tsx
git commit -m "feat: vote-rank-cards RankChip 컴포넌트 추가"
```

---

## Task 2: `RankChip` Storybook 스토리

**Files:**

- Create: `src/features/vote-rank-cards/ui/RankChip.stories.tsx`

- [ ] **Step 1: 스토리 작성**

`src/features/vote-rank-cards/ui/RankChip.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import RankChip from '@/features/vote-rank-cards/ui/RankChip';

const meta: Meta<typeof RankChip> = {
  title: 'Features/VoteRankCards/RankChip',
  component: RankChip,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof RankChip>;

export const Rank1: Story = { args: { rank: 1 } };
export const Rank2: Story = { args: { rank: 2 } };
export const Rank3: Story = { args: { rank: 3 } };
export const Rank4: Story = { args: { rank: 4 } };
export const Rank5: Story = { args: { rank: 5 } };

export const AllRanks: Story = {
  render: () => (
    <div className='flex items-center gap-2'>
      <RankChip rank={1} />
      <RankChip rank={2} />
      <RankChip rank={3} />
      <RankChip rank={4} />
      <RankChip rank={5} />
    </div>
  ),
};
```

- [ ] **Step 2: 커밋**

```bash
git add src/features/vote-rank-cards/ui/RankChip.stories.tsx
git commit -m "chore: vote-rank-cards RankChip Storybook stories 추가"
```

---

## Task 3: `VoteRankCardList` → `totalVoters` prop 전달

**Files:**

- Modify: `src/features/vote-rank-cards/ui/VoteRankCardList.tsx`

> 참고: 본 task에서는 `VoteRankCard`의 prop interface 갱신을 Task 4에서 진행한다. 컴파일이 깨지므로 Task 3·4를 연속해서 적용 후 한 커밋으로 묶는다. 따라서 Task 3의 커밋은 Task 4 종료 후 함께 한다.

- [ ] **Step 1: 리스트에서 `totalVoters` 전달하도록 수정**

`src/features/vote-rank-cards/ui/VoteRankCardList.tsx`을 다음 전체 내용으로 교체:

```tsx
'use client';

import type {
  RankedListResult,
  TimeSlotId,
} from '@/features/vote-rank-cards/lib/types';
import VoteRankCard from '@/features/vote-rank-cards/ui/VoteRankCard';

interface VoteRankCardListProps {
  result: RankedListResult;
  openIds: Set<TimeSlotId>;
  onToggle: (id: TimeSlotId) => void;
}

export default function VoteRankCardList({
  result,
  openIds,
  onToggle,
}: VoteRankCardListProps) {
  return (
    <ul className='flex flex-col gap-3'>
      {result.slots.map((slot) => (
        <VoteRankCard
          key={slot.id}
          slot={slot}
          totalVoters={result.totalVoters}
          isOpen={openIds.has(slot.id)}
          onToggle={onToggle}
        />
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Task 4로 진행 (커밋은 Task 4 끝에서)**

---

## Task 4: `VoteRankCard` 헤더 + 외곽 + body 전면 리디자인

**Files:**

- Modify: `src/features/vote-rank-cards/ui/VoteRankCard.tsx`

- [ ] **Step 1: 파일 전체 교체**

`src/features/vote-rank-cards/ui/VoteRankCard.tsx`을 다음 전체 내용으로 교체:

```tsx
'use client';

import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

import type {
  RankedSlot,
  TimeSlotId,
} from '@/features/vote-rank-cards/lib/types';
import RankChip, {
  type RankChipRank,
} from '@/features/vote-rank-cards/ui/RankChip';
import { cn } from '@/shared/lib/utils';
import Chip from '@/shared/ui/chip/Chip';
import Icon from '@/shared/ui/icon/Icon';

interface VoteRankCardProps {
  slot: RankedSlot;
  totalVoters: number;
  isOpen: boolean;
  onToggle: (id: TimeSlotId) => void;
}

function formatDateLabel(isoDate: string): string {
  return format(parseISO(isoDate), 'M월 d일 EEEE', { locale: ko });
}

export default function VoteRankCard({
  slot,
  totalVoters,
  isOpen,
  onToggle,
}: VoteRankCardProps) {
  const headerId = `vote-rank-card-header-${slot.id}`;
  const panelId = `vote-rank-card-panel-${slot.id}`;
  const hasBadge = slot.rank !== null && slot.rank >= 1 && slot.rank <= 5;

  return (
    <li className='bg-gray-0 overflow-hidden rounded-lg border border-gray-200'>
      <button
        type='button'
        id={headerId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => onToggle(slot.id)}
        className='flex w-full items-center gap-3 px-5 py-4 text-left'
      >
        <div className='flex flex-1 flex-col gap-[3px]'>
          <span className='text-body-4 text-text-secondary'>
            {formatDateLabel(slot.date)}
          </span>
          <div className='flex items-center gap-[6px]'>
            <span className='text-title-7 text-gray-900'>
              {slot.startTime} - {slot.endTime}
            </span>
            {hasBadge ? <RankChip rank={slot.rank as RankChipRank} /> : null}
          </div>
        </div>
        <div className='flex shrink-0 items-center gap-1'>
          <div className='flex items-center gap-0.5'>
            <Icon name='ic_people' size={16} className='text-text-tertiary' />
            <span className='text-body-4 text-text-tertiary'>
              <span className='text-gray-900'>{slot.canCount}</span>
              <span>/{totalVoters}</span>
            </span>
          </div>
          <Icon
            name='arrow_down'
            size='md'
            className={cn(
              'text-text-tertiary transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
          />
        </div>
      </button>
      <div
        id={panelId}
        role='region'
        aria-labelledby={headerId}
        hidden={!isOpen}
        className='border-t border-gray-100 px-5 py-4'
      >
        <VoteRankCardBody slot={slot} />
      </div>
    </li>
  );
}

function VoteRankCardBody({ slot }: { slot: RankedSlot }) {
  return (
    <div className='flex flex-col gap-4'>
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
    </div>
  );
}
```

> 변경 요약:
>
> - `Badge`/`BadgeProps`/`getRankBadgeVariant` 제거 → `RankChip` 사용
> - 헤더 우측에 `ic_people` + `{canCount}/{totalVoters}` + `arrow_down` 영역 추가
> - 외곽 모서리: `rounded-2xl` → `rounded-lg`
> - 시간 텍스트 토큰: `text-title-4 font-semibold` → `text-title-7`(Figma `Title/7` 매핑)
> - 날짜 텍스트 토큰: `text-gray-600` → `text-text-secondary`(`#4e5968`)
> - 본문 섹션 헤더: `text-body-2 font-semibold text-gray-900`(아이콘 없음) → 12px(`text-body-5`) + 색상 토큰 + `ic_circle_check_filled`/`ic_circle_x_filled` 아이콘
> - 참여자 목록: 인라인 `<li>` 텍스트 → `Chip variant=fill size=sm selectable=false`
> - 화살표 회전 로직 정정: 기존은 `!isOpen && 'rotate-180'`라 닫혔을 때 회전했음. Figma는 닫힘=아래방향 화살표(기본), 열림=위방향이므로 `isOpen && 'rotate-180'` 으로 교정.

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 에러 없음. 만약 `text-title-7`이 정의되어 있지 않으면 다음 명령으로 확인:

Run: `grep -n "text-title-7\|text-title-4" src/app/globals.css`

`text-title-7`이 없으면 `text-[16px] leading-[22px] font-semibold tracking-[-0.32px]`로 대체(Figma `Title/7` 정의와 동일).

- [ ] **Step 3: 단위 테스트 회귀 확인**

Run: `npx vitest run src/features/vote-rank-cards`
Expected: 모든 기존 테스트 PASS (`rankSlots.test.ts`, `toRankedSlots.test.ts`, 신규 `RankChip.test.tsx`).

- [ ] **Step 4: 커밋 (Task 3 + Task 4 묶음)**

```bash
git add src/features/vote-rank-cards/ui/VoteRankCardList.tsx src/features/vote-rank-cards/ui/VoteRankCard.tsx
git commit -m "feat: vote-rank-cards 카드 헤더 인원수 표시·본문 리디자인"
```

---

## Task 5: Storybook stories 갱신

**Files:**

- Modify: `src/features/vote-rank-cards/ui/VoteRankCard.stories.tsx`

- [ ] **Step 1: 모든 스토리에 `totalVoters` args 추가**

`src/features/vote-rank-cards/ui/VoteRankCard.stories.tsx`을 다음 전체 내용으로 교체:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type {
  RankBadgeGroup,
  RankedSlot,
} from '@/features/vote-rank-cards/lib/types';
import VoteRankCard from '@/features/vote-rank-cards/ui/VoteRankCard';

const baseCanPeople = [
  { id: '1', name: '상민' },
  { id: '2', name: '쮸니' },
  { id: '3', name: '나용짱' },
  { id: '4', name: '윤정' },
  { id: '5', name: '호연왕자' },
  { id: '6', name: '재민누나' },
  { id: '7', name: '예진공쥬' },
];

function makeSlot(
  rank: number | null,
  badgeGroup: RankBadgeGroup,
  canCount: number,
  cannotCount: number,
): RankedSlot {
  return {
    id: `2026-04-17#0-${rank ?? 'none'}`,
    date: '2026-04-17',
    slotIndex: 0,
    startTime: '12:00',
    endTime: '12:30',
    rank,
    badgeGroup,
    canPeople: baseCanPeople.slice(0, canCount),
    cannotPeople: [
      { id: '8', name: '냐옹' },
      { id: '9', name: '미투표자' },
    ].slice(0, cannotCount),
    canCount,
    cannotCount,
  };
}

const meta: Meta<typeof VoteRankCard> = {
  title: 'Features/VoteRankCards/VoteRankCard',
  component: VoteRankCard,
  parameters: {
    layout: 'padded',
  },
  args: {
    onToggle: () => {},
    totalVoters: 9,
  },
};

export default meta;
type Story = StoryObj<typeof VoteRankCard>;

export const Rank1: Story = {
  args: { isOpen: false, slot: makeSlot(1, 'rank1', 7, 1) },
};

export const Rank2: Story = {
  args: { isOpen: false, slot: makeSlot(2, 'rank2-3', 5, 3) },
};

export const Rank3: Story = {
  args: { isOpen: false, slot: makeSlot(3, 'rank2-3', 4, 4) },
};

export const Rank4: Story = {
  args: { isOpen: false, slot: makeSlot(4, 'rank4-5', 3, 5) },
};

export const Rank5: Story = {
  args: { isOpen: false, slot: makeSlot(5, 'rank4-5', 2, 6) },
};

export const NoRankPositive: Story = {
  args: { isOpen: false, slot: makeSlot(null, 'none', 1, 7) },
};

export const ZeroVote: Story = {
  args: { isOpen: false, slot: makeSlot(null, 'none', 0, 8) },
};

export const Open: Story = {
  args: { isOpen: true, slot: makeSlot(1, 'rank1', 7, 1) },
};

export const OpenManyParticipants: Story = {
  args: { isOpen: true, slot: makeSlot(1, 'rank1', 7, 0) },
};

export const OpenAllAvailable: Story = {
  args: { isOpen: true, slot: makeSlot(2, 'rank2-3', 9, 0) },
};

export const OpenNoneAvailable: Story = {
  args: { isOpen: true, slot: makeSlot(null, 'none', 0, 9) },
};
```

- [ ] **Step 2: 커밋**

```bash
git add src/features/vote-rank-cards/ui/VoteRankCard.stories.tsx
git commit -m "chore: vote-rank-cards Storybook stories totalVoters args 추가"
```

---

## Task 6: lint + 통합 검증 + 시각 확인

**Files:** (없음)

- [ ] **Step 1: lint 실행**

Run: `npm run lint`
Expected: 에러 없음. (warn 발생 시 무시 가능 — 본 작업 외 기존 warn은 그대로 둠.)

- [ ] **Step 2: 전체 테스트 실행**

Run: `npm test`
Expected: 모든 테스트 PASS.

- [ ] **Step 3: 개발 서버에서 시각 확인**

Run: `npm run dev`
Browser: `http://localhost:3000/test/vote-rank-cards`

확인 항목:

1. 카드 우측에 `[ic_people 7/9] [v]` 형태로 인원수 + 화살표가 표시되는가?
2. rank 1 chip은 진한 파랑 배경 + 흰 텍스트, 사각형(`rounded-[4px]`)인가?
3. rank 2·3 chip은 연한 파랑 배경 + 진한 파랑 텍스트인가?
4. rank 4·5 chip은 연한 회색(gray-100) 배경 + 진한 회색(gray-900) 텍스트인가?
5. 카드 외곽 모서리는 8px 라운드인가?
6. 첫 카드를 클릭해 펼치면:
   - 화살표가 위로 회전하는가?
   - "X명이 가능해요" 라벨이 파란색 + 체크 아이콘으로 표시되는가?
   - "Y명이 못와요" 라벨이 주황색(`#ff6749`) + X 아이콘으로 표시되는가?
   - 참여자 이름이 회색(gray-100) 배경 chip 형태로 표시되는가?
7. Figma 스크린샷(노드 `3650:30335`, `3627:6468`)과 육안 비교 시 동일한가?

문제 발견 시: 해당 task로 돌아가 수정. 모든 항목 통과하면 다음 단계로.

- [ ] **Step 4: Storybook에서도 확인 (선택)**

Run: `npm run storybook`
Browser: 자동 오픈

- `Features/VoteRankCards/RankChip` → AllRanks 스토리에서 5개 chip 색상 비교
- `Features/VoteRankCards/VoteRankCard` → 각 rank 스토리, Open\* 스토리 확인

- [ ] **Step 5: 최종 확인**

```bash
git status
git log --oneline -10
```

Expected: working tree clean, 최근 커밋들이 본 작업의 task별 커밋으로 깔끔하게 분리되어 있음.

---

## Self-Review 체크리스트

본 plan이 spec을 완전히 커버하는지 점검:

- ✅ spec §1 (RankChip 신설) → Task 1·2
- ✅ spec §2-1 (rank chip 교체) → Task 4
- ✅ spec §2-2 (헤더 인원수 + 화살표) → Task 4
- ✅ spec §3 (외곽 모서리/펼침 padding) → Task 4
- ✅ spec §4 (`totalVoters` prop 전달) → Task 3·4
- ✅ spec §5-1·5-2 (가능/못와요 섹션 리디자인) → Task 4
- ✅ spec §6 (Badge/Chip 비변경) → 명시적으로 변경 대상에 없음
- ✅ 테스트/검증 → Task 1(unit), Task 6(lint·test·시각)
